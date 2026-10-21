import { Elysia, status } from 'elysia'
import { z } from 'zod'
import { findBookById } from '../books/repository'
import { httpError, serverError, zodError } from '../lib/errorUtils'
import {
  createReviewRequestDto,
  createReviewResponseDto,
  listReviewsResponseDto,
} from './dto'
import {
  createReview,
  findAllReviews,
  findReviewById,
  removeReview,
} from './repository'

const idParams = z.object({
  id: z.cuid(),
})

export const reviews = new Elysia({ prefix: '/reviews' })
  .get('/', async () => await findAllReviews(), {
    response: {
      200: listReviewsResponseDto.describe('Reviews list'),
      500: serverError,
    },
  })

  .post(
    '/',
    async ({ body }) => {
      const book = await findBookById(body.bookId)
      if (!book) {
        return status(404, {
          name: 'HttpError',
          message: 'Book not found',
        })
      }
      const review = await createReview({
        bookId: body.bookId,
        rating: body.rating,
        text: body.text,
      })

      return status(200, review)
    },
    {
      body: createReviewRequestDto,
      response: {
        200: createReviewResponseDto.describe('Review created'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      const review = await findReviewById(params.id)
      if (!review) {
        return status(404, {
          name: 'HttpError',
          message: 'Review not found',
        })
      }
      await removeReview(params.id)
      return {}
    },
    {
      params: idParams,
      response: {
        200: z.object({}).strict().describe('Review deleted'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )
