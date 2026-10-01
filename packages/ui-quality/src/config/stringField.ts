import { expectConfig } from '@/config/expectConfig.js'

/** A string field, or the fallback when it is absent. */
export const stringField = (
  record: Record<string, unknown>,
  key: string,
  fallback: string,
  where: string,
): string => {
  const value = record[key] ?? fallback
  expectConfig(
    typeof value === 'string' && value !== '',
    `${where}.${key} must be a non-empty string`,
  )
  return value
}
