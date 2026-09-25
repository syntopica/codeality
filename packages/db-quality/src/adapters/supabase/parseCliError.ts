import type { CliError } from '@/adapters/supabase/CliError.js'

// The CLI prints progress lines before the document and may print more after
// it, so the JSON is searched for and parsed up to each closing brace in turn
// rather than from the first byte to the last.
export const parseCliError = (text: string): CliError | undefined => {
  const start = text.indexOf('{"_tag":"Error"')
  if (start === -1) return undefined
  for (
    let end = text.indexOf('}', start);
    end !== -1;
    end = text.indexOf('}', end + 1)
  ) {
    try {
      const { error } = JSON.parse(text.slice(start, end + 1)) as {
        error: CliError
      }
      return { code: error.code, message: error.message }
    } catch {
      // Not the closing brace of the document yet; try the next one.
    }
  }
  return { code: 'unknown', message: text.slice(start, start + 200) }
}
