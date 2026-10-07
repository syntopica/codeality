import { join } from 'node:path'

import { isDirectory } from '@/config/isDirectory.js'

// The Supabase CLI keeps config.toml, migrations and the link under
// `supabase/`; a project without it has no linked audit or Supabase perf
// target for a workflow to pass credentials to.
/** True when the project is a Supabase CLI project, with a `supabase/` directory. */
export const isSupabaseProject = (root: string): boolean =>
  isDirectory(join(root, 'supabase'))
