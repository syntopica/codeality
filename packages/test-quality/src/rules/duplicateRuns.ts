import type { Finding } from '@/model/Finding.js'
import type { TestFile } from '@/model/TestFile.js'

/**
 * Files the suite runs more than once. With vitest `projects` and
 * `extends: true`, a project's `include` is added to the root's rather than
 * replacing it, so every file can run in two projects and the run stays
 * green while doing the work twice.
 */
export const duplicateRuns = (files: TestFile[]): Finding[] => {
  const projects = new Map<string, string[]>()
  for (const { file, project } of files) {
    projects.set(file, [...(projects.get(file) ?? []), project])
  }
  const repeated = [...projects].filter(([, names]) => names.length > 1)
  if (repeated.length === 0) return []
  return [
    {
      rule: 'duplicate-file-run',
      severity: 'warning',
      message: `${String(repeated.length)} of ${String(projects.size)} test files run more than once`,
      evidence: repeated.map(
        ([file, names]) => `${file} (${names.join(', ')})`,
      ),
    },
  ]
}
