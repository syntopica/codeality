/**
 * Run `conform(path)` over each consumer, as estate rows. One unreadable
 * project becomes an error row instead of taking the sweep down: the report
 * is most useful precisely when part of the estate is broken.
 */
export async function conformRows(consumers, conform) {
  const rows = []
  for (const consumer of consumers) {
    try {
      const { findings } = await conform(consumer.path)
      rows.push({ name: consumer.name, findings })
    } catch (error) {
      rows.push({ name: consumer.name, error: String(error.message) })
    }
  }
  return rows
}
