import type {
  Book,
  Genre,
  GenresOnBooks,
  Review,
} from '../../generated/prisma/client'
import type { BookUpdateInput } from '../../generated/prisma/models'
import prisma from '../lib/prisma'

// Prisma returns Decimal fields as objects; the API contract exposes price as
// a string, so serialise at the repository boundary.
const serializePrice = <T extends { price: { toString(): string } }>(
  row: T,
): Omit<T, 'price'> & { price: string } => ({
  ...row,
  price: row.price.toString(),
})

export type BookRecord = Omit<Book, 'price'> & { price: string }
export type BookWithGenres = BookRecord & {
  genres: (GenresOnBooks & { genre: Genre })[]
}
export type BookWithDetails = BookWithGenres & { reviews: Review[] }

export const createBook = async (data: {
  title: string
  isbn: string
  publishedAt: Date
  price: number
  inStock: boolean
  genreIds: string[]
}): Promise<BookRecord> => {
  const book = await prisma.book.create({
    data: {
      title: data.title,
      isbn: data.isbn,
      publishedAt: data.publishedAt,
      price: data.price,
      inStock: data.inStock,
      genres: {
        create: data.genreIds.map((genreId) => ({
          genre: { connect: { id: genreId } },
        })),
      },
    },
  })
  return serializePrice(book)
}

export const findAllBooks = async (): Promise<BookWithGenres[]> => {
  const books = await prisma.book.findMany({
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  })

  return books.map(serializePrice)
}

export const findBookByIsbn = async (
  isbn: string,
): Promise<BookRecord | null> => {
  const book = await prisma.book.findUnique({
    where: { isbn },
  })
  return book && serializePrice(book)
}

export const findBookById = async (
  id: string,
): Promise<BookWithDetails | null> => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      reviews: true,
      genres: {
        include: {
          genre: true,
        },
      },
    },
  })
  return book && serializePrice(book)
}

export const updateBook = async (
  id: string,
  data: BookUpdateInput,
): Promise<BookRecord> => {
  const book = await prisma.book.update({
    where: { id },
    data,
  })
  return serializePrice(book)
}

export const removeBook = async (id: string): Promise<void> => {
  await prisma.book.delete({ where: { id } })
}
