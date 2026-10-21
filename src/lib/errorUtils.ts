import { z } from 'zod'

export const zodError = z
  .object({
    success: z.boolean(),
    error: z
      .object({
        name: z.literal('ZodError'),
        message: z.string(),
      })
      .strict(),
  })
  .describe('Validation error')

export const httpError = z
  .object({
    name: z.literal('HttpError'),
    message: z.string(),
  })
  .describe('Http error')

export const conflictError = z
  .object({
    name: z.literal('ConflictError'),
    message: z.string(),
  })
  .describe('Conflict error')

export const serverError = z
  .object({
    name: z.enum(['PrismaError', 'UnknownError']),
    message: z.string(),
  })
  .describe('Server error')
