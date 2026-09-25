/** A required executable is absent: exit code 3, never a skip. */
export class ToolMissingError extends Error {
  constructor(tool: string, hint: string) {
    super(`${tool} is not installed or not on PATH; ${hint}`)
  }
}
