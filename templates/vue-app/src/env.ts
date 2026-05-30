import { z } from 'zod'

export const env = z
  .object({
    VITE_API_BASE_URL: z.string().url(),
  })
  .parse(import.meta.env)
