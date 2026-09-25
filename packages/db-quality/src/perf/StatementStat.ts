export type StatementStat = {
  role: string
  queryId: string
  text: string
  calls: number
  totalMs: number
  rows: number
  sharedBlksRead: number
  tempBlksWritten: number
}
