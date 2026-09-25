export type TableStat = {
  name: string
  liveRows: number
  seqScan: number
  idxScan: number
  bytes: number
}
