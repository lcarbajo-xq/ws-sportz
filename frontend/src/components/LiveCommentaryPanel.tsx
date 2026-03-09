import type { Commentary } from '../types/domain'

interface LiveCommentaryPanelProps {
  matchId: number | null
  commentary: Commentary[]
}

export function LiveCommentaryPanel({
  matchId,
  commentary
}: LiveCommentaryPanelProps) {
  if (!matchId) {
    return (
      <div className='bg-amber-50 border border-amber-200 rounded-xl p-8 text-center'>
        <p className='text-gray-600'>Select a match to view live commentary</p>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getEventBadgeColor = (eventType: string | null) => {
    switch (eventType?.toLowerCase()) {
      case 'goal':
        return 'bg-green-100 text-green-700'
      case 'kickoff':
        return 'bg-yellow-400 text-gray-900'
      case 'save':
        return 'bg-green-500 text-white'
      case 'shot':
        return 'bg-yellow-400 text-gray-900'
      case 'pass':
        return 'bg-green-400 text-white'
      case 'chance':
        return 'bg-orange-100 text-orange-800'
      case 'build_up':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className='bg-amber-50 border border-amber-200 rounded-xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-bold text-gray-900'>Live Commentary</h2>
        <span className='px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium'>
          Real-time
        </span>
      </div>

      <div className='space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto'>
        {commentary.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No commentary available yet
          </div>
        ) : (
          commentary.map((item) => (
            <div
              key={item.id}
              className='bg-white/70 rounded-lg p-3 border border-amber-100'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='w-2 h-2 bg-green-500 rounded-full shrink-0'></span>
                  <span className='text-xs text-gray-500'>
                    {formatTime(item.createdAt)}
                  </span>
                  {item.minute !== null && (
                    <span className='text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                      {item.minute}'
                    </span>
                  )}
                  {item.sequence !== null && (
                    <span className='text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                      Seq {item.sequence}
                    </span>
                  )}
                  {item.period && (
                    <span className='text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                      {item.period} half
                    </span>
                  )}
                </div>
                {item.eventType && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getEventBadgeColor(item.eventType)}`}>
                    {item.eventType}
                  </span>
                )}
              </div>

              {(item.actor || item.team) && (
                <div className='text-sm font-medium text-gray-600 mb-1'>
                  {item.actor && (
                    <span className='text-gray-800'>{item.actor}</span>
                  )}
                  {item.actor && item.team && (
                    <span className='text-gray-400'> · </span>
                  )}
                  {item.team && (
                    <span className='text-gray-500'>{item.team}</span>
                  )}
                </div>
              )}

              <p className='text-sm text-gray-700 leading-relaxed border-l-2 border-gray-200 pl-3 my-2'>
                {item.message}
              </p>

              {item.tags && item.tags.length > 0 && (
                <div className='text-xs text-gray-500 uppercase tracking-wide mt-2'>
                  {item.tags.join(' · ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
