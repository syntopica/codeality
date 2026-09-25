import type { StatementWindow } from '@/perf/StatementWindow.js'

export const statementContext = (window: StatementWindow): string =>
  `${window.role}|${window.queryId}`
