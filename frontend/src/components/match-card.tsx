import { useEffect, useRef, useState } from 'react'
import type { Match } from '../types/domain'
import { config } from '../consts'

interface MatchCardProps {
  match: Match
  isWatching: boolean
  onWatchClick: () => Promise<void>
  onCloseClick: () => void
}

const { SCORE_PULSE_DURATION_MS } = config

export function MatchCard({
  match,
  isWatching,
  onWatchClick,
  onCloseClick
}: MatchCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [homeScorePulse, setHomeScorePulse] = useState(false)
  const [awayScorePulse, setAwayScorePulse] = useState(false)
  const actualScoreRef = useRef({
    home: match.homeScore,
    away: match.awayScore
  })
  const pulseAnimationTimeoutRef = useRef<{
    home?: ReturnType<typeof setTimeout>
    away?: ReturnType<typeof setTimeout>
  }>({})

  const isLive = match.status === 'live'

  useEffect(() => {
    const prevScore = actualScoreRef.current
    const hasHomeScoreChanged = prevScore.home !== match.homeScore
    const hasAwayScoreChanged = prevScore.away !== match.awayScore

    if (hasHomeScoreChanged) {
      setHomeScorePulse(true)
      if (pulseAnimationTimeoutRef.current.home) {
        clearTimeout(pulseAnimationTimeoutRef.current.home)
      }
      pulseAnimationTimeoutRef.current.home = setTimeout(() => {
        setHomeScorePulse(false)
      }, SCORE_PULSE_DURATION_MS)
    }

    if (hasAwayScoreChanged) {
      setAwayScorePulse(true)
      if (pulseAnimationTimeoutRef.current.away) {
        clearTimeout(pulseAnimationTimeoutRef.current.away)
      }
      pulseAnimationTimeoutRef.current.away = setTimeout(() => {
        setAwayScorePulse(false)
      }, SCORE_PULSE_DURATION_MS)
    }

    actualScoreRef.current = { home: match.homeScore, away: match.awayScore }
  }, [match.homeScore, match.awayScore])

  useEffect(() => {
    const animationTimeoutCurrent = pulseAnimationTimeoutRef.current

    return () => {
      if (animationTimeoutCurrent.home) {
        clearTimeout(animationTimeoutCurrent.home)
      }
      if (animationTimeoutCurrent.away) {
        clearTimeout(animationTimeoutCurrent.away)
      }
    }
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function actionLabel() {
    if (isLive) {
      return isWatching ? 'Watching live' : 'Watch live'
    }
    if (match.status === 'finished') {
      return isWatching ? 'Viewing recap' : 'View recap'
    }

    return isWatching ? 'Viewing match' : 'View match'
  }

  const handleWatchClick = async () => {
    setIsLoading(true)
    try {
      await onWatchClick()
    } catch (error) {
      console.error('Failed to watch match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayStatus =
    match.status.charAt(0).toUpperCase() + match.status.slice(1).toLowerCase()
  return (
    <div
      className={`
      relative p-5 rounded-2xl border-2 border-black bg-white transition-all duration-200
      ${isWatching ? 'shadow-hard -translate-x-0.5 -translate-y-0.5 ring-2 ring-brand-yellow ring-offset-2' : 'hover:shadow-hard-sm'}
    `}>
      <div className='flex justify-between items-start mb-4'>
        <span className='text-xs font-bold uppercase tracking-wider text-gray-500 border border-black rounded-full px-2 py-0.5'>
          {match.sport}
        </span>
        <div className='flex items-center gap-2'>
          {isLive && (
            <span className='flex h-3 w-3 relative'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-black'></span>
            </span>
          )}
          <span
            className={`text-sm font-medium ${isWatching ? 'text-red-600' : 'text-gray-600'}`}>
            {displayStatus}
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-3 mb-6'>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-medium'>{match.homeTeam}</span>
          <span
            className={`
              font-bold text-2xl border border-black rounded-lg px-3 py-1 min-w-12 text-center transition-colors
              ${homeScorePulse ? 'bg-brand-yellow animate-pulse' : 'bg-gray-100'}
            `}>
            {match.homeScore}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-medium'>{match.awayTeam}</span>
          <span
            className={`
              font-bold text-2xl border border-black rounded-lg px-3 py-1 min-w-12 text-center transition-colors
              ${awayScorePulse ? 'bg-brand-yellow animate-pulse' : 'bg-gray-100'}
            `}>
            {match.awayScore}
          </span>
        </div>
      </div>
      <div className='flex items-center justify-between mt-auto pt-4 border-t-2 border-gray-100 border-dashed'>
        <span className='text-xs text-gray-500 font-medium'>
          {formatTime(match.startTime)}
        </span>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleWatchClick}
            className={`
              px-4 py-2 rounded-full font-bold text-sm border-2 border-black transition-all
              ${
                isWatching
                  ? 'bg-brand-blue text-black cursor-default opacity-100'
                  : 'bg-brand-yellow text-black hover:bg-yellow-300 active:translate-y-0.5'
              }
            `}
            disabled={isWatching || isLoading}>
            {actionLabel()}
          </button>
          {isWatching && (
            <button
              type='button'
              onClick={onCloseClick}
              className='px-3 py-2 rounded-full font-bold text-xs border-2 border-black bg-white hover:bg-gray-50 transition-all'>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
