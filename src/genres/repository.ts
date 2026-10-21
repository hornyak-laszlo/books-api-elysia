import type { Genre } from '../../generated/prisma/client'
import prisma from '../lib/prisma'

export const createGenre = async (name: string): Promise<Genre> => {
  const genre = await prisma.genre.create({ data: { name } })
  return genre
}

export const findAllGenres = async (): Promise<Genre[]> => {
  const genres = await prisma.genre.findMany()
  return genres
}

export const findGenreByName = async (name: string): Promise<Genre | null> => {
  const genre = await prisma.genre.findUnique({
    where: { name },
  })
  return genre
}

export const findGenreById = async (id: string): Promise<Genre | null> => {
  const genre = await prisma.genre.findUnique({
    where: { id },
  })
  return genre
}

export const countGenreBooks = async (id: string): Promise<number> => {
  const count = await prisma.genresOnBooks.count({
    where: { genreId: id },
  })
  return count
}

export const removeGenre = async (id: string): Promise<void> => {
  await prisma.genre.delete({ where: { id } })
}
