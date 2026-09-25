import type { AdvisorEntry } from '@/adapters/supabase/AdvisorEntry.js'
import type { Severity } from '@/model/Severity.js'

// Strict mode has no info severity: an advisor's INFO-level entry still
// blocks the gate, so it is treated as a warn like everything else that is
// not an outright error.
export const ADVISOR_SEVERITY: Record<AdvisorEntry['level'], Severity> = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'warn',
}
