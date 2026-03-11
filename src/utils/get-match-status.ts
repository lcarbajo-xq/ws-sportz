import { Match } from '../db/schema.js'
import { MATCH_STATUS, MatchStatus } from '../validation/matches.js'

type MatchToUpdate = Pick<Match, 'id' | 'startTime' | 'status' | 'endTime'>
export function getMatchStatus(
  startTime: string | Date,
  endTime: string | Date,
  now = new Date()
) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED
  }
  if (now >= end) {
    return MATCH_STATUS.FINISHED
  }

  return MATCH_STATUS.LIVE
}

export async function syncMatchStatus(
  match: MatchToUpdate,
  updateStatus: (status: MatchStatus) => Promise<void>
) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime)
  if (!nextStatus) {
    return match.status
  }

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus)
  }

  return nextStatus ?? match.status
}
