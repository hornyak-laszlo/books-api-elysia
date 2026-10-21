import { z } from 'zod'

export const createReviewRequestDto = z
  .object({
    bookId: z.cuid(),
    rating: z.int().min(0).max(10),
    text: z.string().min(1),
  })
  .strict()

export const createReviewResponseDto = z
  .object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    bookId: z.string(),
    rating: z.int(),
    text: z.string(),
  })
  .strict()

export const listReviewsResponseDto = z.array(
  z
    .object({
      id: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      bookId: z.string(),
      rating: z.int(),
      text: z.string(),
    })
    .strict(),
)
