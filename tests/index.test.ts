import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import app from '../src/index'
import prisma from '../src/lib/prisma'

// Elysia equivalent of hono's app.request(): dispatch through the app
// without binding a port.
const request = (path: string, init?: RequestInit) =>
  app.handle(new Request(`http://localhost${path}`, init))

app.get(
  '/__test-prisma-error',
  async () => {
    await prisma.book.create({
      data: {
        title: 'Dup',
        isbn: 'SAME-ISBN-999',
        publishedAt: new Date(),
        price: 1,
        inStock: true,
      },
    })
    await prisma.book.create({
      data: {
        title: 'Dup2',
        isbn: 'SAME-ISBN-999',
        publishedAt: new Date(),
        price: 1,
        inStock: true,
      },
    })
  },
  { detail: { hide: true } },
)

// Seed IDs — match seed.sql exactly
const BOOK_1 = 'clbook001'
const BOOK_2 = 'clbook002'
const BOOK_3 = 'clbook003'
const GENRE_FANTASY = 'clgenfntsy001'
const GENRE_SCIFI = 'clgenscifi002'
const GENRE_MYSTERY = 'clgenmstry003'
const GENRE_NONFIC = 'clgennonfic004'
const REVIEW_1 = 'clrev0001'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
})

async function resetDb() {
  const res = await request('/reset-db', { method: 'POST' })
  if (res.status !== 200) throw new Error(`DB reset failed: ${res.status}`)
}

// ---------------------------------------------------------------------------
// Reset DB before every test so each test starts from a clean known state
// ---------------------------------------------------------------------------

beforeEach(resetDb)
afterEach(resetDb)

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

describe('GET /books', () => {
  it('returns 200 with all 4 seeded books as an array', async () => {
    const res = await request('/books')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(4)
    expect(body[0].id).toBe(BOOK_1)
  })

  it('each book has expected shape', async () => {
    const res = await request('/books')
    const [book] = await res.json()

    expect(book).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      isbn: expect.any(String),
      price: expect.any(String), // Decimal serialises as string
      inStock: expect.any(Boolean),
      genres: expect.any(Array),
    })
  })
})

describe('GET /books/:id', () => {
  it('returns 200 with full book including reviews and genres', async () => {
    const res = await request(`/books/${BOOK_1}`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe(BOOK_1)
    expect(body.price).toBe('19.99')
    expect(body.reviews).toHaveLength(2)
    expect(body.genres).toHaveLength(1)
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/books/not-a-cuid')
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/books/clunknown0000000000000000')
    expect(res.status).toBe(404)
  })
})

describe('POST /books', () => {
  it('creates a book and returns 200 with the new record', async () => {
    const res = await request('/books', {
      method: 'POST',
      ...json({
        title: 'Test',
        isbn: 'TEST-ISBN-001',
        publishedAt: '2025-10-27',
        price: 16.99,
        inStock: true,
        genres: [GENRE_FANTASY, GENRE_MYSTERY],
      }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe('Test')
    expect(body.price).toBe('16.99')
    expect(body.createdAt).toBeDefined()
  })

  it('returns 409 when ISBN already exists', async () => {
    const res = await request('/books', {
      method: 'POST',
      ...json({
        title: 'Duplicate',
        isbn: '9780000000011',
        publishedAt: '2025-10-27',
        price: 16.99,
        inStock: true,
        genres: [],
      }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request('/books', {
      method: 'POST',
      ...json({ title: 'Incomplete' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when unknown fields are sent (strict schema)', async () => {
    const res = await request('/books', {
      method: 'POST',
      ...json({
        title: 'Test',
        isbn: 'TEST-ISBN-002',
        publishedAt: '2025-10-27',
        price: 16.99,
        inStock: true,
        genres: [],
        extraField: 'should be rejected',
      }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /books/:id', () => {
  it('updates price and inStock, returns 200', async () => {
    const res = await request(`/books/${BOOK_1}`, {
      method: 'PATCH',
      ...json({ price: 18.99, inStock: false }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.price).toBe('18.99')
    expect(body.inStock).toBe(false)
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/books/bad-id', {
      method: 'PATCH',
      ...json({ price: 9.99, inStock: true }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/books/clunknown0000000000000000', {
      method: 'PATCH',
      ...json({ price: 9.99, inStock: true }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 when body is missing required fields', async () => {
    const res = await request(`/books/${BOOK_1}`, {
      method: 'PATCH',
      ...json({ price: 9.99 }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /books/:id', () => {
  it('deletes a book and returns 200 with an empty object', async () => {
    const res = await request(`/books/${BOOK_1}`, { method: 'DELETE' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })

  it('deleted book is no longer retrievable', async () => {
    await request(`/books/${BOOK_1}`, { method: 'DELETE' })
    const res = await request(`/books/${BOOK_1}`)
    expect(res.status).toBe(404)
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/books/bad-id', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/books/clunknown0000000000000000', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

describe('GET /genres', () => {
  it('returns 200 with all 4 seeded genres as an array', async () => {
    const res = await request('/genres')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(4)
    expect(body[0].id).toBe(GENRE_FANTASY)
  })

  it('each genre has expected shape', async () => {
    const res = await request('/genres')
    const [genre] = await res.json()

    expect(genre).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      createdAt: expect.any(String),
    })
  })
})

describe('GET /genres/:id', () => {
  it('returns 200 with the requested genre', async () => {
    const res = await request(`/genres/${GENRE_FANTASY}`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe(GENRE_FANTASY)
    expect(body.name).toBe('Fantasy')
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/genres/not-a-cuid')
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/genres/clunknown0000000000000000')
    expect(res.status).toBe(404)
  })
})

describe('POST /genres', () => {
  it('creates a genre and returns 200 with the new record', async () => {
    const res = await request('/genres', {
      method: 'POST',
      ...json({ name: 'Test' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.name).toBe('Test')
    expect(body.createdAt).toBeDefined()
  })

  it('returns 409 when name already exists', async () => {
    const res = await request('/genres', {
      method: 'POST',
      ...json({ name: 'Fantasy' }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request('/genres', {
      method: 'POST',
      ...json({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when unknown fields are sent (strict schema)', async () => {
    const res = await request('/genres', {
      method: 'POST',
      ...json({ name: 'Test', extra: true }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /genres/:id', () => {
  it('deletes a genre and returns 200 with an empty object', async () => {
    const res = await request(`/genres/${GENRE_NONFIC}`, {
      method: 'DELETE',
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })

  it('deleted genre is no longer in the list', async () => {
    await request(`/genres/${GENRE_NONFIC}`, { method: 'DELETE' })
    const res = await request('/genres')
    const body = await res.json()

    expect(body).toHaveLength(3)
    expect(
      body.find((g: { id: string }) => g.id === GENRE_NONFIC),
    ).toBeUndefined()
  })

  it('returns 409 when genre is assigned to books', async () => {
    const res = await request(`/genres/${GENRE_FANTASY}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/genres/bad-id', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/genres/clunknown0000000000000000', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

describe('GET /reviews', () => {
  it('returns 200 with all seeded reviews as an array', async () => {
    const res = await request('/reviews')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(4)
    expect(body[0].id).toBe(REVIEW_1)
  })

  it('each review has expected shape', async () => {
    const res = await request('/reviews')
    const [review] = await res.json()

    expect(review).toMatchObject({
      id: expect.any(String),
      bookId: expect.any(String),
      rating: expect.any(Number),
      text: expect.any(String),
      createdAt: expect.any(String),
    })
  })
})

describe('POST /reviews', () => {
  it('creates a review and returns 200 with the new record', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      ...json({ bookId: BOOK_1, rating: 5, text: 'Really good!' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.bookId).toBe(BOOK_1)
    expect(body.createdAt).toBeDefined()
  })

  it('returns 404 when book does not exist', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      ...json({
        bookId: 'clunknown0000000000000000',
        rating: 5,
        text: 'Good',
      }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      ...json({ bookId: BOOK_1 }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when bookId is not a valid cuid', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      ...json({ bookId: 'not-a-cuid', rating: 5, text: 'Good' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when rating is out of range', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      ...json({ bookId: BOOK_1, rating: 11, text: 'Too high' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /reviews/:id', () => {
  it('deletes a review and returns 200 with an empty object', async () => {
    const res = await request(`/reviews/${REVIEW_1}`, { method: 'DELETE' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
  })

  it('deleted review no longer appears on the book', async () => {
    await request(`/reviews/${REVIEW_1}`, { method: 'DELETE' })
    const res = await request(`/books/${BOOK_1}`)
    const book = await res.json()

    expect(book.reviews).toHaveLength(1)
    expect(
      book.reviews.find((r: { id: string }) => r.id === REVIEW_1),
    ).toBeUndefined()
  })

  it('returns 400 for a non-cuid id', async () => {
    const res = await request('/reviews/bad-id', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request('/reviews/clunknown0000000000000000', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Cross-resource / seed data integrity
// ---------------------------------------------------------------------------

describe('Seed data integrity', () => {
  it('book 2 has 2 genres (Fantasy + Science Fiction)', async () => {
    const res = await request(`/books/${BOOK_2}`)
    const body = await res.json()

    expect(body.genres).toHaveLength(2)
    const genreIds = body.genres.map((g: { genreId: string }) => g.genreId)
    expect(genreIds).toContain(GENRE_FANTASY)
    expect(genreIds).toContain(GENRE_SCIFI)
  })

  it('book 3 is out of stock', async () => {
    const res = await request(`/books/${BOOK_3}`)
    const body = await res.json()

    expect(body.inStock).toBe(false)
  })

  it('deleting a book cascades and removes its reviews', async () => {
    await request(`/books/${BOOK_1}`, { method: 'DELETE' })

    const res = await request(`/reviews/${REVIEW_1}`, { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

describe('GET /doc', () => {
  it('returns the OpenAPI spec as JSON', async () => {
    const res = await request('/doc')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.openapi).toBe('3.0.0')
    expect(body.info.title).toBe('Books API')
    expect(body.info.version).toBe('1.0.0')
    expect(body.paths).toBeDefined()
  })
})

describe('GET /redoc', () => {
  it('returns the ReDoc HTML page', async () => {
    const res = await request('/redoc')
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(text).toContain('<!DOCTYPE html>')
    expect(text).toContain('redoc')
  })
})

describe('Prisma error handling', () => {
  it('returns 500 for an unexpected Prisma error', async () => {
    const res = await request('/__test-prisma-error')
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.name).toBe('PrismaError')
  })
})
