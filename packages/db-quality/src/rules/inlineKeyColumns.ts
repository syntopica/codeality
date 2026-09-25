/** Columns declared `primary key` or `unique` inside a create table body, plus its table-level constraints. */
export const inlineKeyColumns = (body: string): string[] => {
  const columns: string[] = []
  for (const part of body.split(/,(?![^(]*\))/)) {
    const item = part.trim()
    const constraint =
      /^(?:constraint\s+\S+\s+)?(?:primary key|unique)\s*\(([^)]*)\)/i.exec(
        item,
      )
    if (constraint?.[1]) {
      const head = constraint[1]
        .split(',')[0]
        ?.trim()
        .replaceAll('"', '')
        .toLowerCase()
      if (head) columns.push(head)
      continue
    }
    const column =
      /^(?:"([^"]+)"|([a-z_][\w$]*))\s[^,]*\b(?:primary key|unique)\b/i.exec(
        item,
      )
    if (column) columns.push((column[1] ?? column[2] ?? '').toLowerCase())
  }
  return columns
}
