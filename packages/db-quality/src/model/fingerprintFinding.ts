import { createHash } from 'node:crypto'

import type { Finding } from '@/model/Finding.js'

// The line is deliberately excluded: a migration inserted above must not
// renew every finding below it. The context (the normalised statement, or the
// tool's message) is what tells two findings on one path apart.
export const fingerprintFinding = (
  finding: Omit<Finding, 'fingerprint'>,
  context: string,
): string =>
  createHash('sha256')
    .update(['1', finding.code, finding.path, context].join('|'))
    .digest('hex')
    .slice(0, 16)
