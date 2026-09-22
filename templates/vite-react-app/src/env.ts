// zod/mini, not the classic builder: the same check costs ~13 kB less brotli
// in the shipped bundle, which is the difference between this template being
// inside its size budget and over it.
import * as z from 'zod/mini'

export const env = z.parse(
  z.object({
    VITE_API_BASE_URL: z.url(),
  }),
  import.meta.env,
)
