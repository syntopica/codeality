import { runSquawkWith } from '@/adapters/squawk/runSquawkWith.js'
import { SUPABASE_SQUAWK_EXCLUDES } from '@/adapters/squawk/SUPABASE_SQUAWK_EXCLUDES.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** squawk over the Supabase migration set, with the Supabase profile. */
export const runSquawk = (
  runner: CommandRunner,
  root: string,
  set: MigrationFile[],
  disabled: DisableEntry[],
): Finding[] =>
  runSquawkWith(runner, root, set, {
    excludes: SUPABASE_SQUAWK_EXCLUDES,
    disabled,
  })
