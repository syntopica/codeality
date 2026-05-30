import { z } from 'zod'

export const greetingSchema = z.object({
  message: z.string().min(1),
})
