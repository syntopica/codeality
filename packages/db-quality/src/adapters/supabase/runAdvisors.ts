import { parseAdvisorReport } from '@/adapters/supabase/parseAdvisorReport.js'
import { supabaseJson } from '@/adapters/supabase/supabaseJson.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import { targetArgs } from '@/audit/targetArgs.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runAdvisors = (
  runner: CommandRunner,
  root: string,
  target: AuditTarget,
  disabled: DisableEntry[],
): Finding[] =>
  parseAdvisorReport(
    supabaseJson(
      runner,
      root,
      [
        'db',
        'advisors',
        '--type',
        'all',
        '--output-format',
        'json',
        ...targetArgs(target),
      ],
      'supabase advisors',
    ),
    disabled,
  )
