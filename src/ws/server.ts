import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import { Server } from 'http'
import { Match } from '../db/schema.js'

/**
 * Sends a value serialized as JSON over a WebSocket if the socket is open.
 *
 * @param socket - The WebSocket to send the payload on.
 * @param payload - The value to serialize and send.
 */
function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}

/**
 * Broadcasts a value to all currently open WebSocket clients.
 *
 * The `payload` is serialized to JSON and sent to each client in the server whose
 * connection is in the OPEN state; clients not open are skipped.
 *
 * @param wss - The WebSocketServer whose connected clients will receive the message
 * @param payload - The value to serialize to JSON and broadcast to clients
 */
function broadcast(wss: WebSocketServer, payload: unknown) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue

    client.send(JSON.stringify(payload))
  }
}

/**
 * Attach a WebSocket server at path "/ws" to an existing HTTP server and provide a helper to broadcast match creation events.
 *
 * @param server - The HTTP server instance to bind the WebSocketServer to.
 * @returns An object with `broadcastMatchCreated(match)` which broadcasts a `{ type: 'match_created', data: match }` message to all connected clients.
 */
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
