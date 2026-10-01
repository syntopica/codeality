export type RuleOptions = {
  rowMisaligned: { tolerance: number; minRows: number }
  controlInset: { minInset: number }
  contentWidth: { minRatio: number; minViewport: number }
  palette: { maxDeltaE: number }
}
