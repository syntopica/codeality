import { join } from 'node:path'

import type { AuthConfig } from '@/config/AuthConfig.js'
import { STATE_DIR } from '@/config/STATE_DIR.js'

/** The session file a run reads: the project's own when it mints one, else the one a form login writes. */
export const statePathOf = (root: string, auth: AuthConfig | null): string =>
  auth?.storageState
    ? join(root, auth.storageState)
    : join(root, STATE_DIR, 'state.json')
