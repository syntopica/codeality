/** The part of vitest's JSON reporter output the audit reads. */
export type VitestJsonReport = {
  testResults: {
    name: string
    startTime: number
    endTime: number
    status: string
  }[]
}
