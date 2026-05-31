import { z } from 'zod'

// Next inlines NEXT_PUBLIC_* and evaluates this at build time. The URL format is
// always validated; a build-safe default keeps `next build` hermetic when no
// .env is present. Override via NEXT_PUBLIC_SITE_URL (see .env.example).
export const env = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.url().default('https://example.com'),
  })
  .parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })
