import type { Diagnostic } from './Diagnostic.js'

/** The `diagnostics` part of a gate's `--json` output, versioned on its own. */
export type DiagnosticsDocument = {
  schemaVersion: 1
  diagnostics: Diagnostic[]
}
