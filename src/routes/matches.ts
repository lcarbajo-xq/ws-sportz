import { Router } from 'express'
import {
  createMatchSchema,
  listMatchesQuerySchema,
  MATCH_STATUS
} from '../validation/matches.js'
import { db } from '../db/db.js'
import { matches } from '../db/schema.js'
import { getMatchStatus } from '../utils/get-match-status.js'
import { desc } from 'drizzle-orm'
const MAX_LIMIT = 60
export const matchsRouter = Router()

matchsRouter.get('/', async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid query parameters',
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
      error: 'invalid payload',
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

    res.status(201).json({ message: 'Match created', match: event })
  } catch (error) {
    console.error('Failed to create match:', error)
    res.status(500).json({ error: 'Failed to create match' })
  }
})
