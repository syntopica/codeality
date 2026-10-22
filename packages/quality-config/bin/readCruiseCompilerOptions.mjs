import { resolve } from 'node:path'
import ts from 'typescript'
import { throwCruiseConfigDiagnostic } from './throwCruiseConfigDiagnostic.mjs'

export function readCruiseCompilerOptions(configPath) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    resolve(configPath),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: throwCruiseConfigDiagnostic,
    },
  )
  if (!parsed)
    throw new Error(`Cannot read TypeScript configuration: ${configPath}`)
  if (parsed.errors.length > 0) throwCruiseConfigDiagnostic(parsed.errors[0])
  return parsed.options
}
