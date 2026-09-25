/** A required stage that could not run is a failure, never a skip. */
export type StageStatus =
  'passed' | 'findings' | 'failed-to-run' | 'skipped-not-applicable'
