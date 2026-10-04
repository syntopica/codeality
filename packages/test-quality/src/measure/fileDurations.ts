import type { FileDuration } from '@/model/FileDuration.js'
import type { VitestJsonReport } from '@/model/VitestJsonReport.js'

/** Seconds each file's tests took, slowest first. */
export const fileDurations = (report: VitestJsonReport): FileDuration[] =>
  report.testResults
    .map((result) => ({
      file: result.name,
      seconds: (result.endTime - result.startTime) / 1000,
      status: result.status,
    }))
    .sort((a, b) => b.seconds - a.seconds)
