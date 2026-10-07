import type { CliError } from '@/adapters/supabase/CliError.js'

export type CliErrorDocument = {
  error: CliError
}
