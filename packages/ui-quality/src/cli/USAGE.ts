export const USAGE = `usage: codeality-ui [--project <dir>] <command> [options]

  init                                        write codeality-ui.json and ignore .codeality-ui/
  check     [--json] [--routes <glob>]        drive every route, light and dark, at every viewport; report design defects
  baseline  create|update|check [--check-stale]   record, refresh or enforce the findings the project carries

Screenshots and the last report land in .codeality-ui/ (report.json, screens/).

exit codes: 0 passed, 1 findings, 2 invalid usage or configuration, 3 browser failure (a page that fails twice is a capture-failed finding)
`
