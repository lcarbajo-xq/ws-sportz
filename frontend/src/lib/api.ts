import type { Commentary, Match } from '../types/domain'

export interface MatchesResponse {
  matches: Match[]
}

export interface CommentaryResponse {
  commentary: Commentary[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005'

export const api = {
  async getMatches(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/matches?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.statusText}`)
    }
    const { matches } = (await response.json()) as MatchesResponse
    return matches
  },
  async getCommentaries(matchId: number, limit = 50) {
    const response = await fetch(
      `${API_BASE_URL}/matches/${matchId}/commentary?limit=${limit}`
    )
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Match not found')
      }
      throw new Error(`Failed to fetch commentary: ${response.statusText}`)
    }
    const { commentary } = (await response.json()) as CommentaryResponse
    return commentary
  }
}
