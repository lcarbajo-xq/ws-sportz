import { useCallback, useEffect, useRef, useState } from 'react'
import type { Commentary, Match } from '../types/domain'
import { WebSocketClient } from '../lib/ws'
import type { WSConnectionState } from '../lib/ws'
import { api } from '../lib/api'

export function useLiveMatch() {
  const [connectionState, setConnectionState] =
    useState<WSConnectionState>('disconnected')

  const [matches, setMatches] = useState<Match[]>([])
  const [newMatchesCount, setNewMatchesCount] = useState(0)
  const [commentaries, setCommentaries] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoadingCommentaries, setIsLoadingCommentaries] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<null | number>(null)

  const wsClientRef = useRef<WebSocketClient | null>(null)
  const commentaryCacheRef = useRef<Map<number, Commentary[]>>(new Map())
  const selectedMatchIdRef = useRef<number | null>(null)

  const matchesAlreadyCreated = useRef(new Set<string>())
  const newMatchesCountTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId
  }, [selectedMatchId])

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedMatches = await api.getMatches()
      const matchesIDs = new Set(fetchedMatches.map((m) => String(m.id)))
      if (matchesAlreadyCreated.current.size > 0) {
        let newCount = 0
        matchesIDs.forEach((matchId) => {
          if (!matchesAlreadyCreated.current.has(matchId)) {
            newCount += 1
          }
        })
        if (newCount > 0) {
          setNewMatchesCount((prev) => prev + newCount)
        }

        if (newMatchesCountTimeoutRef.current) {
          clearTimeout(newMatchesCountTimeoutRef.current)
        }
        newMatchesCountTimeoutRef.current = setTimeout(() => {
          setNewMatchesCount(0)
          newMatchesCountTimeoutRef.current = null
        }, 5000)
      }

      matchesIDs.forEach((id) => matchesAlreadyCreated.current.add(id))
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
    setIsLoadingCommentaries(true)

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
    } finally {
      setIsLoadingCommentaries(false)
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

  const dismissNewMatches = useCallback(() => {
    if (newMatchesCountTimeoutRef.current) {
      clearTimeout(newMatchesCountTimeoutRef.current)
      newMatchesCountTimeoutRef.current = null
    }
    setNewMatchesCount(0)
  }, [])

  // Create WebSocket client only once
  useEffect(() => {
    wsClientRef.current = new WebSocketClient({
      onConnectionChange: (state) => {
        setConnectionState(state)

        if (state === 'connected') {
          if (selectedMatchIdRef.current) {
            wsClientRef.current?.subscribe(selectedMatchIdRef.current)
          }
        }
      },
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
      onScoreUpdated: (message) => {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === message.data.id
              ? {
                  ...m,
                  homeScore: message.data.homeScore,
                  awayScore: message.data.awayScore
                }
              : m
          )
        )
      },
      onMatchCreated: (message) => {
        const newMatchId = String(message.data.id)
        if (matchesAlreadyCreated.current.has(newMatchId)) {
          return
        }

        matchesAlreadyCreated.current.add(newMatchId)
        setMatches((prev) =>
          prev.some((m) => m.id === message.data.id)
            ? prev
            : [message.data, ...prev]
        )
        setNewMatchesCount((prev) => prev + 1)

        if (newMatchesCountTimeoutRef.current) {
          clearTimeout(newMatchesCountTimeoutRef.current)
        }
        newMatchesCountTimeoutRef.current = setTimeout(() => {
          setNewMatchesCount(0)
          newMatchesCountTimeoutRef.current = null
        }, 5000)
      },
      onError: (errorMsg) => {
        console.error('WebSocket error on UseEffect', errorMsg)
      }
    })

    wsClientRef.current.initConnection()
    return () => {
      if (newMatchesCountTimeoutRef.current) {
        clearTimeout(newMatchesCountTimeoutRef.current)
        newMatchesCountTimeoutRef.current = null
      }
      if (wsClientRef.current) {
        wsClientRef.current.disconnect()
        wsClientRef.current = null
      }
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
    newMatchesCount,
    selectMatch,
    deselectMatch,
    dismissNewMatches,
    reloadMatches: fetchMatches,
    isLoadingCommentaries,
    loading,
    error
  }
}
