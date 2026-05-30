import { z } from 'zod'

export const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
})
