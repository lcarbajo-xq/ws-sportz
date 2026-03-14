import { useCallback, useEffect, useRef, useState } from 'react'
import type { Commentary, Match } from '../types/domain'
import { WebSocketClient } from '../lib/ws'
import type { WSConnectionState } from '../lib/ws'
import { api } from '../lib/api'

export function useLiveMatch() {
  const [connectionState, setConnectionState] =
    useState<WSConnectionState>('disconnected')

  const [matches, setMatches] = useState<Match[]>([])
  const [commentaries, setCommentaries] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<null | number>(null)

  const wsClientRef = useRef<WebSocketClient | null>(null)
  const commentaryCacheRef = useRef<Map<number, Commentary[]>>(new Map())
  const selectedMatchIdRef = useRef<number | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId
  }, [selectedMatchId])

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedMatches = await api.getMatches()
      setMatches(fetchedMatches)
    } catch (err) {
      console.error('Failed to load matches')
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [])

  const selectMatch = useCallback(async (matchId: number) => {
    if (!wsClientRef.current) return

    // Unsubscribe from previous match using ref (always current value)
    if (selectedMatchIdRef.current) {
      wsClientRef.current.unsubscribe(selectedMatchIdRef.current)
    }

    setSelectedMatchId(matchId)
    selectedMatchIdRef.current = matchId
    setError(null)

    const cachedCommentaries = commentaryCacheRef.current.get(matchId)
    if (cachedCommentaries) {
      setCommentaries(cachedCommentaries)
    } else {
      setCommentaries([])
    }

    wsClientRef.current.subscribe(matchId)

    try {
      const fetchedCommentaries = await api.getCommentaries(matchId)
      if (selectedMatchIdRef.current !== matchId) return
      const current = commentaryCacheRef.current.get(matchId) ?? []
      const merged = Array.from(
        new Map(
          [...current, ...fetchedCommentaries].map((item) => [item.id, item])
        ).values()
      )
      commentaryCacheRef.current.set(matchId, merged)
      setCommentaries(merged)
    } catch (err) {
      if (selectedMatchIdRef.current !== matchId) return
      console.error('Failed to load commentaries for match', err)
      setError(err instanceof Error ? err.message : 'Failed to load commentary')
    }
  }, [])

  const deselectMatch = useCallback(() => {
    if (selectedMatchIdRef.current && wsClientRef.current) {
      wsClientRef.current.unsubscribe(selectedMatchIdRef.current)
    }
    setSelectedMatchId(null)
    selectedMatchIdRef.current = null
    setCommentaries([])
  }, [])

  // Create WebSocket client only once
  useEffect(() => {
    const wsClient = new WebSocketClient({
      onConnectionChange: (state) => setConnectionState(state),
      onMatchCommentary: (message) => {
        const newCommentary = message.data

        const cachedCommentaries =
          commentaryCacheRef.current.get(newCommentary.matchId) || []
        const updated = [newCommentary, ...cachedCommentaries]
        commentaryCacheRef.current.set(newCommentary.matchId, updated)

        // Use ref to get current selectedMatchId (avoids stale closure)
        if (newCommentary.matchId === selectedMatchIdRef.current) {
          setCommentaries((prev) => [newCommentary, ...prev])
        }
      },
      onMatchCreated: (message) => {
        setMatches((prev) => [message.data, ...prev])
      },
      onError: (errorMsg, matchId) => {
        console.error('WebSocket error', errorMsg, matchId)
        setError(errorMsg)
      }
    })

    wsClient.connect()
    wsClientRef.current = wsClient

    return () => {
      wsClient.disconnect()
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return {
    matches,
    commentaries,
    selectedMatchId,
    connectionState,
    selectMatch,
    deselectMatch,
    reloadMatches: fetchMatches,
    loading,
    error
  }
}
