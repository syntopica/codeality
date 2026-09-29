import { ToolMissingError } from '@/tools/ToolMissingError.js'

/** The call's result, or undefined when sqlite3 refused it; a missing sqlite3 still throws. */
export const attemptSqlite = <T>(call: () => T): T | undefined => {
  try {
    return call()
  } catch (error) {
    if (error instanceof ToolMissingError) throw error
    return undefined
  }
}
