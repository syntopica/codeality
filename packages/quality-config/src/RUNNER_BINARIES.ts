/**
 * The binaries each runner dependency provides, keyed by package name. A
 * script that names one of them directly is something knip resolves on its
 * own, so the package needs no `ignoreDependencies` entry; a script that only
 * names the `baseline-*` runner hides it.
 */
export const RUNNER_BINARIES: Record<string, string[]> = {
  jscpd: ['jscpd'],
  'type-coverage': ['type-coverage'],
  'dependency-cruiser': ['depcruise', 'dependency-cruise'],
  lefthook: ['lefthook'],
}
