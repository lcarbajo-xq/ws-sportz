import { z } from 'zod'

// Match ID parameter schema
export const matchIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive()
})

// List commentary query schema
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional()
})

// Create commentary schema
export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative(),
  sequence: z.number().int().optional(),
  period: z.string().min(1),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional()
})
