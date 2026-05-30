import { defineEventHandler } from 'h3'

import type { Greeting } from '~~/server/types/Greeting'
import { greetingSchema } from '~~/server/utils/greetingSchema'

// Typed GET route. The response is validated against the same Zod schema the
// client uses, so the contract is enforced at the boundary on both sides.
export default defineEventHandler((): Greeting => {
  return greetingSchema.parse({ message: 'Hello from Nuxt' })
})
