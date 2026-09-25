import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { AuditTarget } from '@/audit/AuditTarget.js'
import type { AuditTargetFlags } from '@/audit/AuditTargetFlags.js'
import { ConfigError } from '@/config/ConfigError.js'

export const resolveAuditTarget = (
  root: string,
  values: AuditTargetFlags,
): AuditTarget => {
  if (values['db-url']) return { dbUrl: values['db-url'] }
  if (values.linked) {
    if (!existsSync(join(root, 'supabase/.temp/project-ref'))) {
      throw new ConfigError(
        'project is not linked; run "supabase link" or pass --db-url',
      )
    }
    return { linked: true }
  }
  throw new ConfigError('audit needs --linked or --db-url')
}
