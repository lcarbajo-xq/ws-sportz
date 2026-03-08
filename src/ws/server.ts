import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { Commentary, Match } from '../db/schema.js'
import { wsArcjet } from '../arcjet.js'

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
}

function unsubscribe(matchId: number, socket: ExtendedWebSocket) {
  const subscribers = matchSubscriptions.get(matchId)
  if (!subscribers) return

  subscribers.delete(socket)

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

function handleMessage(socket: ExtendedWebSocket, data: WebSocket.RawData) {
  let message: any
  try {
    message = JSON.parse(data.toString())
  } catch (error) {
    console.error('Invalid JSON message:', data.toString())
    sendJson(socket, { type: 'error', error: 'Invalid JSON format' })
    return
  }

  if (message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket)
    socket.subscriptions?.add(message.matchId)
    sendJson(socket, { type: 'subscribed', matchId: message.matchId })
  }

  if (message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket)
    socket.subscriptions?.delete(message.matchId)
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

    socket.on('pong', () => {
      socket.isAlive = true
    })

    socket.subscriptions = new Set()
    sendJson(socket, { type: 'welcome' })

    socket.on('message', (data) => handleMessage(socket, data))

    socket.on('error', () => {
      socket.terminate()
    })

    socket.on('close', () => {
      cleanSocketSubscriptions(socket)
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

  return { broadcastMatchCreated, broadcastMatchCommentary }
}
