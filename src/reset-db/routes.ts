import { readFileSync } from 'node:fs'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { serverError } from '../lib/errorUtils'
import prisma from '../lib/prisma'

export const resetDb = new Elysia({ prefix: '/reset-db' }).post(
  '/',
  async () => {
    const sql = readFileSync(new URL('../../seed.sql', import.meta.url), 'utf8')

    await prisma.$executeRawUnsafe(sql)

    return { status: 'ok' }
  },
  {
    response: {
      200: z
        .object({
          status: z.string(),
        })
        .describe('Reset DB'),
      500: serverError,
    },
  },
)
