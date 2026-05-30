import type { z } from 'zod'

import type { greetingSchema } from '@/services/greetingSchema'

export type Greeting = z.infer<typeof greetingSchema>
