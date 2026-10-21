import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia, status } from 'elysia'
import { logixlysia } from 'logixlysia'
import { z } from 'zod'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '../generated/prisma/internal/prismaNamespace'
import { books } from './books/routes'
import { genres } from './genres/routes'
import { resetDb } from './reset-db/routes'
import { reviews } from './reviews/routes'

const app = new Elysia()
  .use(logixlysia())
  .use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  .use(
    openapi({
      provider: null,
      specPath: '/doc',
      openapiVersion: '3.0.0',
      documentation: {
        info: {
          title: 'Books API',
          version: '1.0.0',
        },
      },
      mapJsonSchema: {
        zod: (schema: z.ZodType) =>
          z.toJSONSchema(schema, { unrepresentable: 'any' }),
      },
    }),
  )
  .onError(({ code, error }) => {
    if (code === 'VALIDATION') {
      return status(400, {
        success: false,
        error: {
          name: 'ZodError',
          message: error.message,
        },
      })
    }

    if (code === 'NOT_FOUND') {
      return status(404, {
        name: 'HttpError',
        message: 'Route not found',
      })
    }

    if (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientUnknownRequestError ||
      error instanceof PrismaClientValidationError ||
      error instanceof PrismaClientInitializationError ||
      error instanceof PrismaClientRustPanicError
    ) {
      console.error('PRISMA ERROR')
      return status(500, {
        name: 'PrismaError',
        message: error.message,
      })
    }

    const message = error instanceof Error ? error.message : String(error)
    console.error('UNKNOWN ERROR')
    console.error(message)
    return status(500, {
      name: 'UnknownError',
      message,
    })
  })
  .use(books)
  .use(reviews)
  .use(genres)
  .use(resetDb)
  .get(
    '/redoc',
    () => {
      const redocHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <redoc spec-url='/doc'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `
      return new Response(redocHtml, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    },
    { detail: { hide: true } },
  )

export type App = typeof app

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number.parseInt(process.env.PORT || '3000', 10))
}

export default app
