import { z } from 'zod'

export const env = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.url(),
  })
  .parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })
