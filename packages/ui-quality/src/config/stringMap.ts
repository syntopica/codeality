import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'

/** An object whose values are all strings, or an empty one when absent. */
export const stringMap = (
  value: unknown,
  where: string,
): Record<string, string> => {
  if (value === undefined) return {}
  expectConfig(
    isRecord(value) &&
      Object.values(value).every((entry) => typeof entry === 'string'),
    `${where} must be an object of strings`,
  )
  return value as Record<string, string>
}
