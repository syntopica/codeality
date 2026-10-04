/**
 * The phases of vitest's summary line as shares (%) of the work. vitest 5
 * prints shares already (`environment 31%`); vitest 4 prints summed worker
 * time (`environment 73.60s`), which is converted to its share of the sum.
 */
export const phaseShares = (list: string): Record<string, number> => {
  const values: Record<string, number> = {}
  let percent = true
  for (const part of list.split(',')) {
    const phase = /^([a-z]+) ([\d.]+)(%|ms|s)$/.exec(part.trim())
    if (phase?.[1] === undefined) continue
    const unit = phase[3]
    percent &&= unit === '%'
    values[phase[1]] = Number(phase[2]) / (unit === 'ms' ? 1000 : 1)
  }
  if (percent) return values
  const total = Object.values(values).reduce((sum, value) => sum + value, 0)
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      Math.round((value / total) * 100),
    ]),
  )
}
