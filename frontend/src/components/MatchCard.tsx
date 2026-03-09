import { useState } from 'react'
import type { Match } from '../types/domain'

interface MatchCardProps {
  match: Match
  isWatching: boolean
  onWatchClick: () => Promise<void>
  onCloseClick: () => void
}

export function MatchCard({
  match,
  isWatching,
  onWatchClick,
  onCloseClick
}: MatchCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border-3 transition-all ${
        isWatching ? 'border-yellow-400 shadow-md' : 'border-transparent'
      }`}>
      <div className='flex items-center justify-between mb-4'>
        <span className='inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide'>
          {match.sport}
        </span>
        {isLive && (
          <span className='flex items-center text-red-500 text-sm font-medium'>
            <span className='w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse'></span>
            Live
          </span>
        )}
      </div>

      <div className='space-y-3 mb-4'>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-medium'>{match.homeTeam}</span>
          <span className='text-xl font-bold text-gray-900 min-w-10 text-right'>
            {match.homeScore}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-medium'>{match.awayTeam}</span>
          <span className='text-xl font-bold text-gray-900 min-w-10 text-right'>
            {match.awayScore}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
        <span className='text-sm text-gray-400'>
          {formatTime(match.startTime)}
        </span>
        {isWatching ? (
          <div className='flex items-center gap-2'>
            <span className='px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium'>
              Watching Live
            </span>
            <button
              type='button'
              onClick={onCloseClick}
              className='px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors'>
              Close
            </button>
          </div>
        ) : (
          <button
            type='button'
            onClick={handleWatchClick}
            className='px-4 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isFinished || isLoading}>
            Watch Live
          </button>
        )}
      </div>
    </div>
  )
}
