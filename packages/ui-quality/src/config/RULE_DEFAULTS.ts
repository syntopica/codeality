import type { RuleOptions } from '@/config/RuleOptions.js'

export const RULE_DEFAULTS: RuleOptions = {
  rowMisaligned: { tolerance: 2, minRows: 3 },
  controlInset: { minInset: 4 },
  edgeMisaligned: { tolerance: 2, maxOffset: 240 },
  contentWidth: { minRatio: 0.8, minViewport: 1280 },
  palette: { maxDeltaE: 5 },
  slowRequest: { maxMs: 1000 },
  zIndexSprawl: { maxLayers: 6, ceiling: 1000 },
}
