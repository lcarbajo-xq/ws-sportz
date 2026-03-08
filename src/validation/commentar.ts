import { z } from 'zod'

export const listCommentaryQuerySchema = z
  .object({
    limit: z.number().int().positive().max(100).optional().catch(undefined)
  })
  .strict()

export const createCommentarySchema = z
  .object({
    minute: z.number().int().nonnegative(),
    sequence: z.number().int().optional(),
    period: z.string(),
    eventType: z.string().optional(),
    actor: z.string().optional(),
    team: z.string().optional(),
    message: z.string().min(1),
    metadata: z.record(z.any(), z.any()).optional(),
    tags: z.array(z.string()).optional()
  })
  .strict()

export type CreateCommentaryInput = z.infer<typeof createCommentarySchema>
export type ListCommentaryQuery = z.infer<typeof listCommentaryQuerySchema>
