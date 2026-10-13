import type { Finding } from '@/model/Finding.js'

// BDB911-913 come from `perf bench`, against the bench record; BDB901-904
// from `perf diff`, against the snapshot. Never `--record`, which would
// accept the regression instead of checking it.
export const perfRerun = (finding: Finding, flags: string): string =>
  finding.code.startsWith('BDB91')
    ? `codeality-db perf bench${flags} --json`
    : `codeality-db perf diff${flags} --json`
