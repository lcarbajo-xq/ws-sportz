interface SatusIndicatorProps {
  connectionState:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'error'
    | 'reconnecting'
}

export function StatusIndicator({ connectionState }: SatusIndicatorProps) {
  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return {
          text: 'LIVE CONNECTED',
          bgColor: 'bg-green-500',
          dotColor: 'bg-green-300'
        }
      case 'connecting':
        return {
          text: 'CONNECTING',
          bgColor: 'bg-yellow-600',
          dotColor: 'bg-yellow-300'
        }
      case 'disconnected':
        return {
          text: 'DISCONNECTED',
          bgColor: 'bg-gray-500',
          dotColor: 'bg-gray-300'
        }
      case 'reconnecting':
        return {
          text: 'RECONNECTING',
          bgColor: 'bg-orange-400',
          dotColor: 'bg-orange-200'
        }
      case 'error':
        return {
          text: 'ERROR',
          bgColor: 'bg-red-500',
          dotColor: 'bg-red-300'
        }
      default: {
        return {
          text: 'UNKNOWN',
          bgColor: 'bg-gray-500',
          dotColor: 'bg-gray-300'
        }
      }
    }
  }

  const config = getConnectionStatus()

  return (
    <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
      <div
        className={`w-3 h-3 rounded-full border border-black ${config.bgColor} ${connectionState === 'reconnecting' ? 'animate-pulse' : ''}`}
      />
      <span className='text-xs font-bold uppercase tracking-wide'>
        {config.text}
      </span>
    </div>
  )
}
