import { z } from 'zod'

export const createGenreRequestDto = z
  .object({
    name: z.string().min(1),
  })
  .strict()

export const createGenreResponseDto = z
  .object({
    id: z.string(),
    createdAt: z.date(),
    name: z.string(),
  })
  .strict()

export const listGenresResponseDto = z.array(
  z
    .object({
      id: z.string(),
      createdAt: z.date(),
      name: z.string(),
    })
    .strict(),
)
