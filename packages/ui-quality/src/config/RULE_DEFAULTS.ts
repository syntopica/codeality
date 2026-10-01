import type { RuleOptions } from '@/config/RuleOptions.js'

export const RULE_DEFAULTS: RuleOptions = {
  rowMisaligned: { tolerance: 2, minRows: 3 },
  controlInset: { minInset: 4 },
  contentWidth: { minRatio: 0.8, minViewport: 1280 },
  palette: { maxDeltaE: 5 },
}
