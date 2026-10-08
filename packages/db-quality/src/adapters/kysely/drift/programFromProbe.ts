import { compilerOptionsFromTsConfig } from '@/adapters/kysely/drift/compilerOptionsFromTsConfig.js'
import type { DriftProgram } from '@/adapters/kysely/drift/DriftProgram.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

// Builds the probe's TypeScript program and checks it compiles cleanly. Any
// diagnostic on the probe's own import lines means the configured
// databaseType does not resolve, which is a configuration error, not an
// internal one.
export const programFromProbe = (
  ts: DriftTypeScript,
  root: string,
  probe: string,
  ref: DatabaseTypeRef,
): DriftProgram => {
  const options = compilerOptionsFromTsConfig(ts, root)
  const program = ts.createProgram({
    rootNames: [probe],
    options: {
      ...options,
      noEmit: true,
      skipLibCheck: true,
      incremental: false,
      composite: false,
      declaration: false,
    },
  })
  const sourceFile = program.getSourceFile(probe)
  if (sourceFile === undefined) throw new Error('probe module was not compiled')
  const diagnostics = program.getSemanticDiagnostics(sourceFile)
  if (diagnostics.length > 0) {
    const message = diagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('; ')
    throw new ConfigError(
      `kysely.databaseType: cannot resolve "${ref.path}#${ref.exportName}": ${message}`,
    )
  }
  return program
}
