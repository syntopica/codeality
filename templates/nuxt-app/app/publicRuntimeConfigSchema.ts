import { z } from 'zod'

export const publicRuntimeConfigSchema = z.object({
  apiBaseUrl: z.url(),
})
