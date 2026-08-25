// Removes a JS/TS source extension from a filename, leaving the name the
// project actually reasons about. Kind detection matches on the name's own
// suffix (`Mapper`, `Formatter`, ...), and anchoring those checks on `.ts`
// let every `.tsx` twin through - in a React codebase, exactly where mappers
// and formatters get written.
export function stripCodeExtension(basename: string): string {
  return basename.replace(/\.[mc]?[jt]sx?$/, '')
}
