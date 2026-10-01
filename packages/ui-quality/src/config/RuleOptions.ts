export type RuleOptions = {
  rowMisaligned: { tolerance: number; minRows: number }
  controlInset: { minInset: number }
  edgeMisaligned: { tolerance: number; maxOffset: number }
  contentWidth: { minRatio: number; minViewport: number }
  palette: { maxDeltaE: number }
}
