import type { CliError } from '@/adapters/supabase/CliError.js'

// The CLI prints progress lines before the document, so the JSON is searched
// for rather than parsed from the first byte.
export const parseCliError = (text: string): CliError | undefined => {
  const start = text.indexOf('{"_tag":"Error"')
  if (start === -1) return undefined
  try {
    const { error } = JSON.parse(text.slice(start)) as { error: CliError }
    return { code: error.code, message: error.message }
  } catch {
    return { code: 'unknown', message: text.slice(start, start + 200) }
  }
}
