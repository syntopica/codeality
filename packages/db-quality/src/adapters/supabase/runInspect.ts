import { parseBloat } from '@/adapters/supabase/parseBloat.js'
import { parseIndexStats } from '@/adapters/supabase/parseIndexStats.js'
import { supabaseJson } from '@/adapters/supabase/supabaseJson.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import { targetArgs } from '@/audit/targetArgs.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runInspect = (
  runner: CommandRunner,
  root: string,
  target: AuditTarget,
  config: Pick<DbQualityConfig, 'audit' | 'disable'>,
): Finding[] => {
  const query = (report: string): string =>
    supabaseJson(
      runner,
      root,
      [
        'inspect',
        'db',
        report,
        '--output-format',
        'json',
        ...targetArgs(target),
      ],
      `supabase inspect ${report}`,
    )
  return [
    ...parseIndexStats(query('index-stats'), config.disable),
    ...parseBloat(query('bloat'), config.audit.bloatThreshold, config.disable),
  ]
}
