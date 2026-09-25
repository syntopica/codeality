import type { AdvisorEntry } from '@/adapters/supabase/AdvisorEntry.js'
import type { Severity } from '@/model/Severity.js'

export const ADVISOR_SEVERITY: Record<AdvisorEntry['level'], Severity> = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
}
