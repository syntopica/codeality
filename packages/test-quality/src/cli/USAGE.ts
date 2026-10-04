export const USAGE = `usage: codeality-test [--project <dir>] <command> [options]

  check    [--json]                                     static findings: files run twice, DOM environments for DOM-free tests, uncached lint in git hooks
  measure  [--json] [--node-candidates] [--top <n>] [-- <vitest args>]
                                                        run the suite once, measured: environment vs test time, slowest files, peak memory;
                                                        --node-candidates reruns the DOM-free candidates under node to confirm which pass

exit codes: 0 passed, 1 findings, 2 invalid usage or configuration, 3 required tool missing or unusable
`
