/** A query parameter JSON can carry and a hash can read: bigint, Date and bytes become strings. */
export const jsonSafeParameter = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array)
    return `x'${Buffer.from(value).toString('hex')}'`
  return value
}
