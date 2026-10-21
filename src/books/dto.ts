import { z } from 'zod'

export const createBookRequestDto = z
  .object({
    title: z.string().min(1).max(255),
    isbn: z.string().min(1).max(13),
    publishedAt: z.coerce.date(),
    price: z.number().min(0.01),
    inStock: z.boolean(),
    genres: z.array(z.cuid()),
  })
  .strict()

export const updateBookRequestDto = z
  .object({
    price: z.number().min(0.01),
    inStock: z.boolean(),
  })
  .strict()

export const updateBookResponseDto = z
  .object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    title: z.string(),
    isbn: z.string(),
    publishedAt: z.date(),
    price: z.string(),
    inStock: z.boolean(),
  })
  .strict()

export const createBookResponseDto = updateBookResponseDto

export const listBooksResponseDto = z.array(
  z
    .object({
      id: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      title: z.string(),
      isbn: z.string(),
      publishedAt: z.date(),
      price: z.string(),
      inStock: z.boolean(),
      genres: z.array(
        z
          .object({
            bookId: z.string(),
            genreId: z.string(),
            genre: z
              .object({
                id: z.string(),
                createdAt: z.date(),
                name: z.string(),
              })
              .strict(),
          })
          .strict(),
      ),
    })
    .strict(),
)

export const getBookResponseDto = z
  .object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    title: z.string(),
    isbn: z.string(),
    publishedAt: z.date(),
    price: z.string(),
    inStock: z.boolean(),
    genres: z.array(
      z
        .object({
          bookId: z.string(),
          genreId: z.string(),
          genre: z
            .object({
              id: z.string(),
              createdAt: z.date(),
              name: z.string(),
            })
            .strict(),
        })
        .strict(),
    ),
    reviews: z.array(
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
    ),
  })
  .strict()
