import type {
  WSClientMessage,
  WSMatchCommentaryMessage,
  WSMatchCreatedMessage,
  WSServerMessage
} from '../types/domain'

const WS_SERVER_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3005/ws'

export type WSConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type WS = {
  onMessage: (event: MessageEvent) => void
  onOpen: () => void
  onClose: () => void
}

export type WSEventHandler = {
  onMessage?: (message: WSServerMessage) => void
  onMatchCommentary?: (message: WSMatchCommentaryMessage) => void
  onMatchCreated?: (message: WSMatchCreatedMessage) => void
  onError?: (error: string, matchId?: number) => void
  onConnectionChange?: (state: WSConnectionState) => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: WSEventHandler = {}
  private connectionState: WSConnectionState = 'disconnected'

  constructor(handlers?: WSEventHandler) {
    if (handlers) {
      this.handlers = handlers
    }
  }

  private handleOpen() {
    this.setConnectionState('connected')
  }

  private handleMessageEvent(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WSServerMessage
      this.handleMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event)
    this.setConnectionState('error')
  }

  private handleClose() {
    this.setConnectionState('disconnected')
  }

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    this.setConnectionState('connecting')
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
    if (message.type === 'error' && this.handlers.onError) {
      this.handlers.onError(message.error, message.matchId)
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
    if (this.ws) {
      this.ws.removeEventListener('open', this.handleOpen)
      this.ws.removeEventListener('message', this.handleMessageEvent)
      this.ws.removeEventListener('error', this.handleError)
      this.ws.removeEventListener('close', this.handleClose)
      this.ws.close()
      this.ws = null
    }
  }

  setHandlers(handlers: WSEventHandler) {
    this.handlers = { ...this.handlers, ...handlers }
  }
}
