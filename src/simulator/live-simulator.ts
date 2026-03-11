import type { Commentary, Match } from '../db/schema.js'

type SimulatorBroadcasters = {
  broadcastMatchCreated?: (match: Match) => void
  broadcastMatchCommentary?: (matchId: number, entry: Commentary) => void
  broadcastScoreUpdated?: (
    matchId: number,
    score: { homeScore: number; awayScore: number }
  ) => void
}

export type SimulatorConfig = {
  tickMs: number
  createMatchProbability: number
  scoreUpdateProbability: number
  maxLiveMatches: number
}

const DEFAULT_CONFIG: SimulatorConfig = {
  tickMs: 3500,
  createMatchProbability: 0.25,
  scoreUpdateProbability: 0.35,
  maxLiveMatches: 6
}

const SPORTS = ['football', 'basketball', 'cricket']
const TEAMS = [
  'Redwood United', 'Kingsport FC', 'Forest Rangers', 'Sunset Blazers',
  'Granite Town', 'Seaside Albion', 'Iron Valley Titans', 'Crescent City Hoops',
  'Capital Royals', 'Northbridge Athletic', 'Blue Harbor City', 'Metro Falcons'
]

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function clampProbability(value: number) {
  return Math.max(0, Math.min(1, value))
}

function buildCommentaryMessage(eventType: string, actor: string, team: string, opponent: string) {
  switch (eventType) {
    case 'goal': return `${actor} scores for ${team}. ${opponent} will restart from kickoff.`
    case 'save': return `${actor} makes a brilliant save to deny ${opponent}.`
    case 'shot': return `${actor} takes a shot from distance. ${team} keeps the pressure on.`
    case 'chance': return `${team} creates a dangerous chance inside the box.`
    case 'pass': return `${actor} links play with a crisp pass for ${team}.`
    default: return `${team} maintains possession and builds from the back.`
  }
}

let nextMatchId = 1000
let nextCommentaryId = 1000

class LiveMatchSimulator {
  private timer: NodeJS.Timeout | null = null
  private config: SimulatorConfig = DEFAULT_CONFIG
  private liveMatches = new Map<number, Match>()
  private sequenceByMatch = new Map<number, number>()

  isRunning() { return this.timer !== null }

  getStatus() {
    return { running: this.isRunning(), config: this.config, liveMatchCount: this.liveMatches.size }
  }

  start(configOverride: Partial<SimulatorConfig>, broadcasters: SimulatorBroadcasters) {
    if (this.isRunning()) return false
    this.config = {
      tickMs: configOverride.tickMs ?? DEFAULT_CONFIG.tickMs,
      createMatchProbability: clampProbability(configOverride.createMatchProbability ?? DEFAULT_CONFIG.createMatchProbability),
      scoreUpdateProbability: clampProbability(configOverride.scoreUpdateProbability ?? DEFAULT_CONFIG.scoreUpdateProbability),
      maxLiveMatches: Math.max(1, configOverride.maxLiveMatches ?? DEFAULT_CONFIG.maxLiveMatches)
    }
    this.timer = setInterval(() => { this.tick(broadcasters) }, this.config.tickMs)
    console.log('[simulator] started with config:', this.config)
    this.tick(broadcasters)
    return true
  }

  stop() {
    if (!this.timer) return false
    clearInterval(this.timer)
    this.timer = null
    this.liveMatches.clear()
    this.sequenceByMatch.clear()
    console.log('[simulator] stopped')
    return true
  }

  private tick(broadcasters: SimulatorBroadcasters) {
    try {
      if (this.liveMatches.size < this.config.maxLiveMatches && Math.random() < this.config.createMatchProbability) {
        this.createLiveMatch(broadcasters)
      }
      if (this.liveMatches.size === 0) return
      const match = pickRandom(Array.from(this.liveMatches.values()))
      console.log(`[simulator] tick match=${match.id} ${match.homeTeam} vs ${match.awayTeam} score=${match.homeScore}-${match.awayScore}`)
      this.createCommentaryForMatch(match, broadcasters)
      this.maybeUpdateScore(match, broadcasters)
    } catch (error) {
      console.error('Simulator tick failed:', error)
    }
  }

  private createLiveMatch(broadcasters: SimulatorBroadcasters) {
    const firstTeam = pickRandom(TEAMS)
    let secondTeam = pickRandom(TEAMS)
    while (secondTeam === firstTeam) { secondTeam = pickRandom(TEAMS) }
    const now = new Date()
    const createdMatch: Match = {
      id: nextMatchId++, sport: pickRandom(SPORTS), homeTeam: firstTeam, awayTeam: secondTeam,
      status: 'live', startTime: new Date(Date.now() - 60_000), endTime: new Date(Date.now() + 90 * 60_000),
      homeScore: 0, awayScore: 0, createdAt: now
    }
    this.liveMatches.set(createdMatch.id, createdMatch)
    broadcasters.broadcastMatchCreated?.(createdMatch)
    console.log(`[simulator] match_created id=${createdMatch.id} ${createdMatch.homeTeam} vs ${createdMatch.awayTeam}`)
  }

  private createCommentaryForMatch(match: Match, broadcasters: SimulatorBroadcasters) {
    const nextSequence = (this.sequenceByMatch.get(match.id) ?? 0) + 1
    this.sequenceByMatch.set(match.id, nextSequence)
    const eventType = pickRandom(['build_up', 'pass', 'shot', 'chance', 'save'])
    const team = Math.random() > 0.5 ? match.homeTeam : match.awayTeam
    const opponent = team === match.homeTeam ? match.awayTeam : match.homeTeam
    const actor = `${pickRandom(['Alex', 'Jordan', 'Taylor', 'Casey', 'Sam'])} ${pickRandom(['Miller', 'Lopez', 'Garcia', 'Brown', 'Silva'])}`
    const minute = Math.min(90, Math.max(1, Math.floor(nextSequence / 2) + 1))
    const newCommentary: Commentary = {
      id: nextCommentaryId++, matchId: match.id, minute, sequence: nextSequence,
      period: minute <= 45 ? '1st' : '2nd', eventType, actor, team,
      message: buildCommentaryMessage(eventType, actor, team, opponent),
      tags: [eventType], metadata: null, createdAt: new Date()
    }
    broadcasters.broadcastMatchCommentary?.(match.id, newCommentary)
    console.log(`[simulator] match_commentary matchId=${match.id} event=${eventType} seq=${nextSequence}`)
  }

  private maybeUpdateScore(match: Match, broadcasters: SimulatorBroadcasters) {
    if (Math.random() >= this.config.scoreUpdateProbability) return
    const homeScored = Math.random() > 0.5
    const nextHomeScore = homeScored ? match.homeScore + 1 : match.homeScore
    const nextAwayScore = homeScored ? match.awayScore : match.awayScore + 1
    const updatedMatch: Match = { ...match, homeScore: nextHomeScore, awayScore: nextAwayScore }
    this.liveMatches.set(match.id, updatedMatch)
    broadcasters.broadcastScoreUpdated?.(match.id, { homeScore: nextHomeScore, awayScore: nextAwayScore })
    console.log(`[simulator] score_updated matchId=${match.id} score=${nextHomeScore}-${nextAwayScore}`)
    const nextSequence = (this.sequenceByMatch.get(match.id) ?? 0) + 1
    this.sequenceByMatch.set(match.id, nextSequence)
    const scoringTeam = homeScored ? match.homeTeam : match.awayTeam
    const goalCommentary: Commentary = {
      id: nextCommentaryId++, matchId: match.id,
      minute: Math.min(90, Math.max(1, Math.floor(nextSequence / 2) + 1)),
      sequence: nextSequence, period: '2nd', eventType: 'goal',
      actor: `${pickRandom(['Alex', 'Jordan', 'Taylor', 'Casey', 'Sam'])} ${pickRandom(['Miller', 'Lopez', 'Garcia', 'Brown', 'Silva'])}`,
      team: scoringTeam, message: `GOAL! ${scoringTeam} increases the score to ${nextHomeScore}-${nextAwayScore}.`,
      tags: ['goal', 'score_update'], metadata: null, createdAt: new Date()
    }
    broadcasters.broadcastMatchCommentary?.(match.id, goalCommentary)
    console.log(`[simulator] match_commentary matchId=${match.id} event=goal seq=${nextSequence}`)
  }
}

export const liveMatchSimulator = new LiveMatchSimulator()
