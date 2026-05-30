import { z } from 'zod'

export const env = z
  .object({
    PUBLIC_SITE_URL: z.url(),
  })
  .parse(import.meta.env)
