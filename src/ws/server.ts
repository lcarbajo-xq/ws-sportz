import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { Commentary, Match, matches } from '../db/schema.js'
import { wsArcjet } from '../arcjet.js'
import { db } from '../db/db.js'
import { eq } from 'drizzle-orm'
import { MatchScore } from '../validation/matches.js'

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean
  subscriptions?: Set<number>
}

const matchSubscriptions = new Map<number, Set<ExtendedWebSocket>>()

function subscribe(matchId: number, socket: ExtendedWebSocket) {
  if (!matchSubscriptions.has(matchId)) {
    matchSubscriptions.set(matchId, new Set())
  }

  matchSubscriptions.get(matchId)!.add(socket)
  socket.subscriptions?.add(matchId)
}

function unsubscribe(matchId: number, socket: ExtendedWebSocket) {
  const subscribers = matchSubscriptions.get(matchId)
  if (!subscribers) return

  subscribers.delete(socket)
  socket.subscriptions?.delete(matchId)

  if (subscribers.size === 0) {
    matchSubscriptions.delete(matchId)
  }
}

function cleanSocketSubscriptions(socket: ExtendedWebSocket) {
  if (!socket.subscriptions) return
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket)
  }
}

function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}

async function matchExists(matchId: number): Promise<boolean> {
  const result = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1)
  return result.length > 0
}

async function handleMessage(
  socket: ExtendedWebSocket,
  data: WebSocket.RawData
) {
  let message: any

  try {
    message = JSON.parse(data.toString())
  } catch (error) {
    console.error('Invalid JSON message:', data.toString())
    sendJson(socket, { type: 'error', error: 'Invalid JSON format' })
    return
  }

  if (message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
    let exists: boolean
    try {
      exists = await matchExists(message.matchId)
    } catch (error) {
      console.error('Failed to validate match existence:', error)
      sendJson(socket, {
        type: 'error',
        error: 'Service unavailable'
      })
      return
    }
    // Race condition check: if match doesn't exist, send error. If it exists but client is already subscribed, send already_subscribed. Otherwise, subscribe the client.
    if (socket.readyState !== WebSocket.OPEN || !socket.subscriptions) {
      return
    }
    if (!exists) {
      sendJson(socket, {
        type: 'error',
        error: 'Match not found',
        matchId: message.matchId
      })
      return
    }
    if (socket.subscriptions?.has(message.matchId)) {
      sendJson(socket, {
        type: 'already_subscribed',
        matchId: message.matchId
      })
      return
    }
    subscribe(message.matchId, socket)
    sendJson(socket, { type: 'subscribed', matchId: message.matchId })
  }

  if (message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket)
    sendJson(socket, { type: 'unsubscribed', matchId: message.matchId })
  }
}

function broadcastToAll(wss: WebSocketServer, payload: unknown) {
  const message = JSON.stringify(payload)
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue

    client.send(message)
  }
}

function broadcastToMatchSubscribers(matchId: number, payload: unknown) {
  const subscribers = matchSubscriptions.get(matchId)
  if (!subscribers || subscribers.size === 0) return

  const message = JSON.stringify(payload)
  for (const subscriber of subscribers) {
    if (subscriber.readyState === WebSocket.OPEN) {
      subscriber.send(message)
    }
  }
}

export function attachWebSocketServer<T extends Server>(server: T) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024
  })

  wss.on('connection', async (socket: ExtendedWebSocket, request) => {
    const pendingMessages: WebSocket.RawData[] = []
    let ready: boolean = false

    socket.on('message', (data) => {
      if (!ready) {
        pendingMessages.push(data)
        return
      }
      handleMessage(socket, data)
    })
    socket.subscriptions = new Set()

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(request)

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008
          const reason = decision.reason.isRateLimit()
            ? 'Rate limit exceeded'
            : 'Access denied'
          socket.close(code, reason)
          return
        }
      } catch (error) {
        console.error('Arcjet WebSocket error:', error)
        socket.close(1011, 'Service unavailable')
        return
      }
    }

    socket.isAlive = true
    ready = true
    for (const data of pendingMessages) {
      handleMessage(socket, data)
    }
    socket.on('pong', () => {
      socket.isAlive = true
    })

    sendJson(socket, { type: 'welcome' })

    socket.on('error', () => {
      cleanSocketSubscriptions(socket)
      socket.terminate()
    })

    socket.on('close', () => {
      cleanSocketSubscriptions(socket)
      socket.terminate()
    })
  })

  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extClient = client as ExtendedWebSocket
      if (extClient.isAlive === false) return extClient.terminate()
      extClient.isAlive = false
      extClient.ping()
    })
  }, 30000)

  wss.on('close', () => clearInterval(interval))

  function broadcastMatchCreated(match: Match) {
    broadcastToAll(wss, { type: 'match_created', data: match })
  }

  function broadcastMatchCommentary(matchId: number, commentary: Commentary) {
    broadcastToMatchSubscribers(matchId, {
      type: 'match_commentary',
      data: commentary
    })
  }

  function broadcastScoreUpdated(matchScore: MatchScore) {
    broadcastToAll(wss, {
      type: 'score_updated',
      data: matchScore
    })
  }

  return {
    broadcastMatchCreated,
    broadcastMatchCommentary,
    broadcastScoreUpdated
  }
}
