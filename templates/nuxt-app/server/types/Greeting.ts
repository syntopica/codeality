import type { z } from 'zod'

import type { greetingSchema } from '~~/server/utils/greetingSchema'

export type Greeting = z.infer<typeof greetingSchema>
