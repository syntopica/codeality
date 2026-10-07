import { stringField } from '@/config/stringField.js'

/** A non-empty string field, or null when it is absent. */
export const optionalString = (
  record: Record<string, unknown>,
  key: string,
  where: string,
): string | null =>
  record[key] === undefined ? null : stringField(record, key, '', where)
