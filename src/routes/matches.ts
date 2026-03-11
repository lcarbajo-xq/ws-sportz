import { Router } from 'express'
import {
  createMatchSchema,
  listMatchesQuerySchema,
  MATCH_STATUS,
  matchIdParamSchema,
  MatchStatus,
  updateScoreSchema
} from '../validation/matches.js'
import { db } from '../db/db.js'
import { Match, matches } from '../db/schema.js'
import { getMatchStatus, syncMatchStatus } from '../utils/get-match-status.js'
import { desc, eq } from 'drizzle-orm'
const MAX_LIMIT = 60
export const matchsRouter = Router()

matchsRouter.get('/', async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: JSON.stringify(parsed.error.issues)
    })
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)
  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit)

    res.status(200).json({ matches: data })
  } catch (error) {
    console.error('Failed to fetch matches:', error)
    res.status(500).json({ error: 'Failed to fetch matches' })
  }
})

matchsRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: JSON.stringify(parsed.error.issues)
    })
  }
  const {
    data: { startTime, endTime, homeScore, awayScore }
  } = parsed
  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime) ?? MATCH_STATUS.SCHEDULED
      })
      .returning()
    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event)
    }
    console.log('Match created')
    res.status(201).json({ message: 'Match created', match: event })
  } catch (error) {
    console.error('Failed to create match:', error)
    res.status(500).json({ error: 'Failed to create match' })
  }
})

matchsRouter.patch('/:id/score', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params)

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: 'Invalid match id',
      details: JSON.stringify(paramsParsed.error.issues)
    })
  }

  const bodyParsed = updateScoreSchema.safeParse(req.body)

  if (!bodyParsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: JSON.stringify(bodyParsed.error.issues)
    })
  }

  const matchId = paramsParsed.data.id

  try {
    const [existingMatch] = await db
      .select({
        id: matches.id,
        status: matches.status,
        startTime: matches.startTime,
        endTime: matches.endTime
      })
      .from(matches)
      .where(eq(matches.id, matchId))

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' })
    }
    let currentStatus = existingMatch.status
    await syncMatchStatus(existingMatch, async (nextStatus: MatchStatus) => {
      currentStatus = nextStatus
      await db
        .update(matches)
        .set({
          status: nextStatus
        })
        .where(eq(matches.id, matchId))
    })

    if (currentStatus !== MATCH_STATUS.LIVE) {
      return res.status(409).json({ error: 'Match is not live' })
    }

    const [updatedMatch] = await db
      .update(matches)
      .set({
        homeScore: bodyParsed.data.homeScore,
        awayScore: bodyParsed.data.awayScore
      })
      .where(eq(matches.id, matchId))
      .returning()

    if (req.app.locals.broadcastScoreUpdated) {
      req.app.locals.broadcastScoreUpdated(matchId, {
        homeScore: updatedMatch.homeScore,
        awayScore: updatedMatch.awayScore
      })
    }
    res.json({ match: updatedMatch })
  } catch (err) {
    console.error('Failed to update match score:', err)
    res.status(500).json({ error: 'Failed to update match score' })
  }
})
