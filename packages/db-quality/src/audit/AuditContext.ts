import type { AuditTarget } from '@/audit/AuditTarget.js'
import type { CheckContext } from '@/check/CheckContext.js'

export type AuditContext = CheckContext & { target: AuditTarget }
