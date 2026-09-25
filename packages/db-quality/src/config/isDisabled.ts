import type { DisableEntry } from '@/config/DisableEntry.js'

export const isDisabled = (code: string, disabled: DisableEntry[]): boolean =>
  disabled.some((entry) => entry.code === code)
