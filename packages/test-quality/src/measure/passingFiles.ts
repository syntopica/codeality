import type { VitestJsonReport } from '@/model/VitestJsonReport.js'

/**
 * Files whose every result passed. A file several projects run appears once
 * per project, and it passes only if it passed in all of them.
 */
export const passingFiles = (report: VitestJsonReport | null): string[] => {
  const failed = new Set<string>()
  const seen = new Set<string>()
  for (const result of report?.testResults ?? []) {
    seen.add(result.name)
    if (result.status !== 'passed') failed.add(result.name)
  }
  return [...seen].filter((file) => !failed.has(file))
}
