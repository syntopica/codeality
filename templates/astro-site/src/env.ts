import { z } from 'zod'

// Astro evaluates this at build time. The URL format is always validated; a
// build-safe default keeps `astro build` hermetic when no .env is present.
// Override via PUBLIC_SITE_URL (see .env.example).
export const env = z
  .object({
    PUBLIC_SITE_URL: z.url().default('https://example.com'),
  })
  .parse(import.meta.env)
