import { expectConfig } from '@/config/expectConfig.js'

/** A list field mapped item by item; absent means the fallback. */
export const listFrom = <T>(
  value: unknown,
  fallback: T[],
  where: string,
  map: (item: unknown, index: number) => T,
): T[] => {
  if (value === undefined) return fallback
  expectConfig(Array.isArray(value), `${where} must be a list`)
  return value.map(map)
}
