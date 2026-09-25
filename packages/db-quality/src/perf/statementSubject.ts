import type { StatementWindow } from '@/perf/StatementWindow.js'

export const statementSubject = (window: StatementWindow): string =>
  `${window.role}: ${window.text.slice(0, 80)}`
