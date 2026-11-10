/**
 * A rule switched off on purpose; the reason is what makes it a decision rather than a silence.
 * `subject`, allowed on `BDB330/` codes only, narrows it to one table or `table.column`.
 */
export type DisableEntry = { code: string; reason: string; subject?: string }
