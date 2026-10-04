import type { ProcessRow } from '@/model/ProcessRow.js'

/** Parses `ps -axo pid=,ppid=,rss=` output. */
export const parseProcessTable = (table: string): ProcessRow[] =>
  table
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((cells) => cells.length === 3 && cells.every(Number.isFinite))
    .map(([pid = 0, ppid = 0, rss = 0]) => ({ pid, ppid, rss }))
