import { createHash } from 'node:crypto'

import { isColorDependent } from '@/model/isColorDependent.js'

// Viewport and pixel values are deliberately excluded: a finding seen at
// three widths is one defect, and a layout nudged by a pixel must not renew
// every finding on the page. The colour scheme counts only for the rules that
// read colour: a contrast failure in dark mode alone is its own defect, a
// misaligned column is the same defect in both schemes.
export const fingerprintFinding = (
  rule: string,
  route: string,
  colorScheme: string,
  identity: string,
): string =>
  createHash('sha256')
    .update(
      [
        '1',
        rule,
        route,
        isColorDependent(rule) ? colorScheme : '*',
        identity,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16)
