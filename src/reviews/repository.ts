import type { Review } from '../../generated/prisma/client'
import prisma from '../lib/prisma'

export const createReview = async (data: {
  bookId: string
  rating: number
  text: string
}): Promise<Review> => {
  const review = await prisma.review.create({
    data: {
      book: { connect: { id: data.bookId } },
      rating: data.rating,
      text: data.text,
    },
  })

  return review
}

export const findAllReviews = async (): Promise<Review[]> => {
  const reviews = await prisma.review.findMany()
  return reviews
}

export const findReviewById = async (id: string): Promise<Review | null> => {
  const review = await prisma.review.findUnique({ where: { id } })
  return review
}

export const removeReview = async (id: string): Promise<void> => {
  await prisma.review.delete({ where: { id } })
}
