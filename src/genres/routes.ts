import { Elysia, status } from 'elysia'
import { z } from 'zod'
import {
  conflictError,
  httpError,
  serverError,
  zodError,
} from '../lib/errorUtils'
import {
  createGenreRequestDto,
  createGenreResponseDto,
  listGenresResponseDto,
} from './dto'
import {
  countGenreBooks,
  createGenre,
  findAllGenres,
  findGenreById,
  findGenreByName,
  removeGenre,
} from './repository'

const idParams = z.object({
  id: z.cuid(),
})

export const genres = new Elysia({ prefix: '/genres' })
  .get('/', async () => await findAllGenres(), {
    response: {
      200: listGenresResponseDto.describe('Genres list'),
      500: serverError,
    },
  })

  .post(
    '/',
    async ({ body }) => {
      const existingGenre = await findGenreByName(body.name)
      if (existingGenre) {
        return status(409, {
          name: 'ConflictError',
          message: 'A genre with this name already exists',
        })
      }
      const genre = await createGenre(body.name)

      return status(200, genre)
    },
    {
      body: createGenreRequestDto,
      response: {
        200: createGenreResponseDto.describe('Genre created'),
        400: zodError,
        409: conflictError,
        500: serverError,
      },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const genre = await findGenreById(params.id)
      if (!genre) {
        return status(404, {
          name: 'HttpError',
          message: 'Genre not found',
        })
      }
      return genre
    },
    {
      params: idParams,
      response: {
        200: createGenreResponseDto.describe('Genre details'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      const genre = await findGenreById(params.id)

      if (!genre) {
        return status(404, {
          name: 'HttpError',
          message: 'Genre not found',
        })
      }

      const bookCount = await countGenreBooks(params.id)
      if (bookCount > 0) {
        return status(409, {
          name: 'ConflictError',
          message: 'Cannot delete genre assigned to books',
        })
      }

      await removeGenre(params.id)
      return {}
    },
    {
      params: idParams,
      response: {
        200: z.object({}).strict().describe('Genre deleted'),
        400: zodError,
        404: httpError,
        409: conflictError,
        500: serverError,
      },
    },
  )
