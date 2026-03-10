// Domain types matching backend schema

export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface Match {
  id: number
  sport: string
  homeTeam: string
  awayTeam: string
  status: MatchStatus
  startTime: string
  endTime: string | null
  homeScore: number
  awayScore: number
  createdAt: string
}

export interface Commentary {
  id: number
  matchId: number
  minute: number | null
  sequence: number | null
  period: string | null
  eventType: string | null
  actor: string | null
  team: string | null
  message: string
  metadata: Record<string, unknown> | null
  tags: string[] | null
  createdAt: string
}

// WebSocket message types
export type WSMessageType =
  | 'welcome'
  | 'subscribe'
  | 'unsubscribe'
  | 'subscribed'
  | 'unsubscribed'
  | 'already_subscribed'
  | 'match_created'
  | 'match_commentary'
  | 'error'

export interface WSBaseMessage {
  type: WSMessageType
}

export interface WSSubscribeMessage extends WSBaseMessage {
  type: 'subscribe'
  matchId: number
}

export interface WSUnsubscribeMessage extends WSBaseMessage {
  type: 'unsubscribe'
  matchId: number
}

export interface WSSubscribedMessage extends WSBaseMessage {
  type: 'subscribed'
  matchId: number
}

export interface WSUnsubscribedMessage extends WSBaseMessage {
  type: 'unsubscribed'
  matchId: number
}

export interface WSAlreadySubscribedMessage extends WSBaseMessage {
  type: 'already_subscribed'
  matchId: number
}

export interface WSMatchCreatedMessage extends WSBaseMessage {
  type: 'match_created'
  data: Match
}

export interface WSMatchCommentaryMessage extends WSBaseMessage {
  type: 'match_commentary'
  data: Commentary
}

export interface WSErrorMessage extends WSBaseMessage {
  type: 'error'
  error: string
  matchId?: number
}

export interface WSWelcomeMessage extends WSBaseMessage {
  type: 'welcome'
}

export type WSServerMessage =
  | WSWelcomeMessage
  | WSSubscribedMessage
  | WSUnsubscribedMessage
  | WSAlreadySubscribedMessage
  | WSMatchCreatedMessage
  | WSMatchCommentaryMessage
  | WSErrorMessage

export type WSClientMessage = WSSubscribeMessage | WSUnsubscribeMessage
