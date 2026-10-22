/** Opt-in finite number; malformed or unsupported declarations use the legacy fallback. */
export const explicitNumericSortKey = (
  type: string | null,
  value: string | null,
): number | undefined =>
  type === 'number' &&
  value !== null &&
  /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) &&
  Number.isFinite(Number(value))
    ? Number(value)
    : undefined
