import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** The absolute paths of every file a tsconfig.json includes, `extends` resolved; [] when it cannot be read. */
export const tsconfigFileNames = (
  compiler: TypeScriptModule,
  tsconfig: string,
  root: string,
): string[] => {
  const read = compiler.readConfigFile(tsconfig, (path) =>
    compiler.sys.readFile(path),
  )
  if (read.error) return []
  return compiler.parseJsonConfigFileContent(
    read.config,
    compiler.sys,
    root,
    undefined,
    tsconfig,
  ).fileNames
}
