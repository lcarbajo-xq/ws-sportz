import type { WSConnectionState } from '../lib/ws'

interface HeaderProps {
  connectionState: WSConnectionState
}

export function Header({ connectionState }: HeaderProps) {
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

  const status = getConnectionStatus()

  return (
    <header className='bg-yellow-400 px-6 py-4'>
      <div className='container mx-auto flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Sportz</h1>
          <p className='text-sm text-gray-700'>
            Live Scores & Real-Time Action
          </p>
        </div>

        <div
          className={`flex items-center gap-2 ${status.bgColor} text-white px-4 py-2 rounded-full`}>
          <span
            className={`w-2 h-2 ${status.dotColor} rounded-full animate-pulse`}></span>
          <span className='text-sm font-medium'>{status.text}</span>
        </div>
      </div>
    </header>
  )
}
