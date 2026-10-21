import { Elysia, status } from 'elysia'
import { z } from 'zod'
import type { BookUpdateInput } from '../../generated/prisma/models'
import {
  conflictError,
  httpError,
  serverError,
  zodError,
} from '../lib/errorUtils'
import {
  createBookRequestDto,
  createBookResponseDto,
  getBookResponseDto,
  listBooksResponseDto,
  updateBookRequestDto,
  updateBookResponseDto,
} from './dto'
import {
  createBook,
  findAllBooks,
  findBookById,
  findBookByIsbn,
  removeBook,
  updateBook,
} from './repository'

const idParams = z.object({
  id: z.cuid(),
})

export const books = new Elysia({ prefix: '/books' })
  .get('/', async () => await findAllBooks(), {
    response: {
      200: listBooksResponseDto.describe('Books list'),
      500: serverError,
    },
  })

  .post(
    '/',
    async ({ body }) => {
      const existingBook = await findBookByIsbn(body.isbn)
      if (existingBook) {
        return status(409, {
          name: 'ConflictError',
          message: 'A book with this ISBN already exists',
        })
      }
      const book = await createBook({
        title: body.title,
        isbn: body.isbn,
        publishedAt: body.publishedAt,
        price: body.price,
        inStock: body.inStock,
        genreIds: body.genres,
      })

      return status(200, book)
    },
    {
      body: createBookRequestDto,
      response: {
        200: createBookResponseDto.describe('Book created'),
        400: zodError,
        409: conflictError,
        500: serverError,
      },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const book = await findBookById(params.id)
      if (!book) {
        return status(404, {
          name: 'HttpError',
          message: 'Book not found',
        })
      }
      return book
    },
    {
      params: idParams,
      response: {
        200: getBookResponseDto.describe('Book details'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body }) => {
      const book = await findBookById(params.id)
      if (!book) {
        return status(404, {
          name: 'HttpError',
          message: 'Book not found',
        })
      }
      const data: BookUpdateInput = {
        price: body.price,
        inStock: body.inStock,
      }
      const updatedBook = await updateBook(params.id, data)
      return updatedBook
    },
    {
      params: idParams,
      body: updateBookRequestDto,
      response: {
        200: updateBookResponseDto.describe('Book updated'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      const book = await findBookById(params.id)
      if (!book) {
        return status(404, {
          name: 'HttpError',
          message: 'Book not found',
        })
      }
      await removeBook(params.id)
      return {}
    },
    {
      params: idParams,
      response: {
        200: z.object({}).strict().describe('Book deleted'),
        400: zodError,
        404: httpError,
        500: serverError,
      },
    },
  )
