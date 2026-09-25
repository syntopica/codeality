export type StatementWindow = {
  role: string
  queryId: string
  text: string
  calls: number
  totalMs: number
  tempBlksWritten: number
  meanMs: number
  previousMeanMs: number | null
}
