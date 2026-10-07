import { expectConfig } from '@/config/expectConfig.js'
import type { Register } from '@/config/Register.js'

/** `register`, or null when the project does not say. */
export const registerFrom = (value: unknown): Register | null => {
  if (value === undefined || value === null) return null
  expectConfig(
    value === 'product' || value === 'brand',
    'register must be "product" or "brand"',
  )
  return value
}
