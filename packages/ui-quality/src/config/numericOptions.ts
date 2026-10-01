import { numberField } from '@/config/numberField.js'

/** Every key of `defaults`, read from the section as a positive number. */
export const numericOptions = <T extends Record<string, number>>(
  section: Record<string, unknown>,
  defaults: T,
  where: string,
): T =>
  Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      numberField(section, key, fallback, where),
    ]),
  ) as T
