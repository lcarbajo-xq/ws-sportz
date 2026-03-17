import { z } from 'zod'
import { Match } from '../db/schema.js'

// List matches query schema
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional()
})

// Match status constant
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished'
} as const

// Match ID parameter schema
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

// Create match schema
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'Sport cannot be empty'),
    homeTeam: z.string().min(1, 'Home team cannot be empty'),
    awayTeam: z.string().min(1, 'Away team cannot be empty'),
    startTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      {
        message: 'startTime must be a valid ISO date string'
      }
    ),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      {
        message: 'endTime must be a valid ISO date string'
      }
    ),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional()
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime']
      })
    }
  })

// Update score schema
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative()
})

// Export types
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>
export type MatchIdParam = z.infer<typeof matchIdParamSchema>
export type CreateMatch = z.infer<typeof createMatchSchema>
export type UpdateScore = z.infer<typeof updateScoreSchema>
type MatchStatusType = typeof MATCH_STATUS
export type MatchStatus = MatchStatusType[keyof MatchStatusType]
export type MatchScore = Pick<Match, 'id' | 'homeScore' | 'awayScore'>
