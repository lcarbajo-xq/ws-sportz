const DEFAULT_API_BASE_URL = 'http://localhost:3005'
const DEFAULT_WS_BASE_URL = 'ws://localhost:3005/ws'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || DEFAULT_WS_BASE_URL

const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000 //
const PAGE_SIZE = 6

export const config = {
  API_BASE_URL,
  WS_BASE_URL,
  MAX_RECONNECT_DELAY,
  INITIAL_RECONNECT_DELAY,
  PAGE_SIZE
} as const
