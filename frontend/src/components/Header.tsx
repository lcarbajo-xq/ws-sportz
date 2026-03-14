import type { WSConnectionState } from '../lib/ws'
import { StatusIndicator } from './status-indicator'

interface HeaderProps {
  connectionState: WSConnectionState
  errorMsg?: string
}

export function Header({ connectionState, errorMsg }: HeaderProps) {
  return (
    <header className='flex flex-col gap-4 md:flex-row items-start md:items-center justify-between bg-brand-yellow p-6 border-2 border-black shadow-hard rounded-2xl'>
      <div className=''>
        <h1 className='text-3xl font-black tracking-tight text-brand-dark mb-4'>
          Sportz
        </h1>
        <p className='text-sm font-medium opacity-80'>
          Live Scores & Real-Time Action
        </p>
      </div>
      <div className='flex flex-col items-end gap-2'>
        <StatusIndicator connectionState={connectionState} />
        {errorMsg && (
          <span className='text-xs font-mono bg-red-200 text-red-700 border border-red-200 px-2 py-1 rounded'>
            Connection: {errorMsg}
          </span>
        )}
      </div>
    </header>
  )
}
