export const USAGE = `usage: codeality-db [--project <dir>] <command> [options]

  init      [--check|--apply|--force]          detect stacks, write codeality-db.json, the db:gate script and the CI workflow
  check     [--json]                           static findings from the repository alone
  audit     --linked|--db-url <url> [--json]   findings from the live database
  gate      [--json]                           check (or baseline check) and the linked audit, one exit code
  baseline  create|update|check [--check-stale]   record, refresh or enforce the debt the project carries
  perf      snapshot|diff|bench [--db-url <url>] [--json] [--record]   record, compare and benchmark the live database

exit codes: 0 passed, 1 findings, 2 invalid usage or configuration, 3 required tool missing or unusable
`
