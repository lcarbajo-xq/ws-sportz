import type {
  WSClientMessage,
  WSMatchCommentaryMessage,
  WSMatchCreatedMessage,
  WSServerMessage,
  WSMatchScoreUpdated
} from '../types/domain'
import { config } from '../consts'

const WS_SERVER_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3005/ws'
const { MAX_RECONNECT_DELAY, INITIAL_RECONNECT_DELAY } = config
export type WSConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'reconnecting'

export type WSEventHandler = {
  onMessage?: (message: WSServerMessage) => void
  onMatchCommentary?: (message: WSMatchCommentaryMessage) => void
  onMatchCreated?: (message: WSMatchCreatedMessage) => void
  onError?: (error: string) => void
  onConnectionChange?: (state: WSConnectionState) => void
  onScoreUpdated?: (message: WSMatchScoreUpdated) => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: WSEventHandler = {}
  private connectionState: WSConnectionState = 'disconnected'
  private _intentionalClose: boolean = false
  private _reconnectionAttempts: number = 0
  private _reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(handlers?: WSEventHandler) {
    if (handlers) {
      this.handlers = handlers
    }
  }

  get socket() {
    return this.ws
  }

  private handleOpen = () => {
    this._reconnectionAttempts = 0
    this.setConnectionState('connected')
  }

  private handleMessageEvent = (event: MessageEvent) => {
    if (event.data === 'pong') {
      if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout)
      return
    }
    try {
      const message = JSON.parse(event.data) as WSServerMessage
      this.handleMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleError = () => {
    console.error('[WebSocket]: Connection error occured')
    this.setConnectionState('error')
  }

  private removeSocketListeners = (socket: WebSocket) => {
    socket.removeEventListener('open', this.handleOpen)
    socket.removeEventListener('message', this.handleMessageEvent)
    socket.removeEventListener('error', this.handleError)
    socket.removeEventListener('close', this.handleClose)
  }

  private handleClose = (event: CloseEvent) => {
    if (this.ws) {
      this.removeSocketListeners(this.ws)
      this.ws = null
    }
    this.setConnectionState(event.wasClean ? 'disconnected' : 'error')

    if (!this._intentionalClose) {
      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout)
        this._reconnectTimeout = null
      }

      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** this._reconnectionAttempts,
        MAX_RECONNECT_DELAY
      )

      console.log(
        `[WebSocket] Disconnected (Code: ${event.code}). Reconnecting in ${delay}ms...`
      )

      this._reconnectTimeout = setTimeout(() => {
        this._reconnectTimeout = null
        this._reconnectionAttempts += 1
        this.connect()
      }, delay)
    }
  }

  initConnection(): void {
    if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout)
    this._reconnectionAttempts = 0
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return
    }
    this.connect()
  }

  connect(): void {
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout)
      this._reconnectTimeout = null
    }

    if (this.ws) {
      this._intentionalClose = true
      this.removeSocketListeners(this.ws)
      this.ws.close()
      this.ws = null
    }
    this.setConnectionState(
      this._reconnectionAttempts > 0 ? 'reconnecting' : 'connecting'
    )
    this._intentionalClose = false
    try {
      this.ws = new WebSocket(WS_SERVER_URL)

      this.ws.addEventListener('open', this.handleOpen)

      this.ws.addEventListener('message', this.handleMessageEvent)

      this.ws.addEventListener('error', this.handleError)
      this.ws.addEventListener('close', this.handleClose)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.setConnectionState('error')
    }
  }

  private setConnectionState(state: WSConnectionState) {
    this.connectionState = state
    if (this.handlers.onConnectionChange) {
      this.handlers.onConnectionChange(state)
    }
  }

  getConnectionState(): WSConnectionState {
    return this.connectionState
  }

  private handleMessage(message: WSServerMessage) {
    if (this.handlers.onMessage) {
      this.handlers.onMessage(message)
    }
    if (
      message.type === 'match_commentary' &&
      this.handlers.onMatchCommentary
    ) {
      this.handlers.onMatchCommentary(message)
    }
    if (message.type === 'match_created' && this.handlers.onMatchCreated) {
      this.handlers.onMatchCreated(message)
    }
    if (message.type === 'score_updated' && this.handlers.onScoreUpdated) {
      this.handlers.onScoreUpdated(message)
    }
    if (message.type === 'error' && this.handlers.onError) {
      this.handlers.onError(message.error)
    }
  }

  send(message: WSClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message)
      this.ws.send(messageString)
    } else {
      console.warn('WebSocket is not connected. Unable to send message:')
    }
  }

  subscribe(matchId: number) {
    this.send({ type: 'subscribe', matchId })
  }

  unsubscribe(matchId: number) {
    this.send({ type: 'unsubscribe', matchId })
  }

  disconnect() {
    this._intentionalClose = true
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout)
      this._reconnectTimeout = null
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }

    const socket = this.ws
    if (socket) {
      this.removeSocketListeners(socket)
      socket.close()
      this.ws = null
    }
  }

  setHandlers(handlers: WSEventHandler) {
    this.handlers = { ...this.handlers, ...handlers }
  }
}
