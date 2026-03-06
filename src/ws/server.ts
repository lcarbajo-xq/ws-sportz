import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { Match } from '../db/schema.js'

function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}

function broadcast(wss: WebSocketServer, payload: unknown) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue

    client.send(JSON.stringify(payload))
  }
}

export function attachWebSocketServer<T extends Server>(server: T) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024
  })

  wss.on('connection', (socket) => {
    sendJson(socket, { type: 'welcome' })

    socket.on('error', console.error)
  })

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: 'match_created', data: match })
  }

  return { broadcastMatchCreated }
}
