import { execFileSync } from 'node:child_process'

/** The machine's process table as `pid ppid rss` lines. */
export const readProcessTable = (): string =>
  execFileSync('ps', ['-axo', 'pid=,ppid=,rss='], { encoding: 'utf8' })
