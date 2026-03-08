import { Router } from 'express'
import {
  matchIdParamSchema,
  createCommentarySchema,
  listCommentaryQuerySchema
} from '../validation/commentary.js'
import { db } from '../db/db.js'
import { commentary, matches } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

const MAX_LIMIT = 100

export const commentaryRouter = Router({ mergeParams: true })

commentaryRouter.get('/', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params)

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: 'invalid match id',
      details: JSON.stringify(paramsParsed.error.issues)
    })
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query)

  if (!queryParsed.success) {
    return res.status(400).json({
      error: 'invalid query parameters',
      details: JSON.stringify(queryParsed.error.issues)
    })
  }

  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT)
  const matchId = paramsParsed.data.matchId

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit)

    res.status(200).json({ commentary: data })
  } catch (error) {
    console.error('Failed to fetch commentary:', error)
    res.status(500).json({ error: 'Failed to fetch commentary' })
  }
})

commentaryRouter.post('/', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params)

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: 'invalid match id',
      details: JSON.stringify(paramsParsed.error.issues)
    })
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body)

  if (!bodyParsed.success) {
    return res.status(400).json({
      error: 'invalid payload',
      details: JSON.stringify(bodyParsed.error.issues)
    })
  }

  try {
    const { minute, ...restOfCommentary } = bodyParsed.data
    const matchId = paramsParsed.data.matchId

    const existingMatch = (
      await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
    )[0]

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId,
        minute,
        ...restOfCommentary
      })
      .returning()

    if (req.app.locals.broadcastMatchCommentary) {
      req.app.locals.broadcastMatchCommentary(matchId, newCommentary)
    }

    res
      .status(201)
      .json({ message: 'Commentary created', commentary: newCommentary })
  } catch (error) {
    console.error('Failed to create commentary:', error)
    res.status(500).json({ error: 'Failed to create commentary' })
  }
})
