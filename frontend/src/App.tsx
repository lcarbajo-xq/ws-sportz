import { Header } from './components/Header'
import { MatchCard } from './components/MatchCard'
import { LiveCommentaryPanel } from './components/LiveCommentaryPanel'
import { useLiveMatch } from './hooks/useLiveMatch'

function App() {
  const {
    commentaries,
    connectionState,
    loading,
    error,
    matches,
    selectedMatchId,
    selectMatch,
    deselectMatch
  } = useLiveMatch()

  const onWatchMatch = (matchId: number) => async () => {
    await selectMatch(matchId)
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <Header connectionState={connectionState} />

      <main className='container mx-auto px-6 py-8'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column: Current Matches */}
          <div className='lg:col-span-2'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-xl font-bold text-gray-900'>
                Current Matches
              </h2>
              <div className='flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded-lg'>
                <span className='text-sm font-medium'>API:</span>
                <span className='text-sm font-bold'>{matches.length}</span>
              </div>
            </div>

            {loading ? (
              <div className='text-center py-12'>
                <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-yellow-400 border-r-transparent'></div>
                <p className='mt-4 text-gray-600'>Loading matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className='bg-white rounded-xl p-12 text-center'>
                <p className='text-gray-600'>No matches available</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {matches.map((match, index) => (
                  <MatchCard
                    key={`${match.id} ${index}`}
                    match={match}
                    isWatching={match.id === selectedMatchId}
                    onWatchClick={onWatchMatch(match.id)}
                    onCloseClick={deselectMatch}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Live Commentary */}
          <div className='lg:col-span-1'>
            <LiveCommentaryPanel
              matchId={selectedMatchId}
              commentary={commentaries}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
