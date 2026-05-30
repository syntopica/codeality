import type { EventHandler } from 'h3'
import { expect, it } from 'vitest'

import type { Greeting } from '~~/server/types/Greeting'

import greetingHandler from './greeting.get'

it('returns a schema-valid greeting payload', async () => {
  const handler = greetingHandler as EventHandler<never, Greeting>
  const result = await handler({} as Parameters<typeof handler>[0])
  expect(result).toEqual({ message: 'Hello from Nuxt' })
})
