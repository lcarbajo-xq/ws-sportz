import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { Match } from '../db/schema.js'

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean
}

function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}

function broadcast(wss: WebSocketServer, payload: unknown) {
  const message = JSON.stringify(payload)
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue

    client.send(message)
  }
}

export function attachWebSocketServer<T extends Server>(server: T) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024
  })

  wss.on('connection', (socket: ExtendedWebSocket) => {
    socket.isAlive = true

    socket.on('pong', () => {
      socket.isAlive = true
    })
    sendJson(socket, { type: 'welcome' })

    socket.on('error', console.error)
  })

  const interval = setInterval(() => {
    for (const client of wss.clients) {
      const extClient = client as ExtendedWebSocket
      if (extClient.isAlive === false) {
        extClient.terminate()
        continue
      }
      extClient.isAlive = false
      extClient.ping()
    }
  }, 30000)

  wss.on('close', () => clearInterval(interval))

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: 'match_created', data: match })
  }

  return { broadcastMatchCreated }
}
