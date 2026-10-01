import { expectConfig } from '@/config/expectConfig.js'

/** A positive number field, or the fallback when it is absent. */
export const numberField = (
  record: Record<string, unknown>,
  key: string,
  fallback: number,
  where: string,
): number => {
  const value = record[key] ?? fallback
  expectConfig(
    typeof value === 'number' && value > 0,
    `${where}.${key} must be a positive number`,
  )
  return value
}
