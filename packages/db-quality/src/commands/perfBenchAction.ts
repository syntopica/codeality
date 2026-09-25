import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import { readBenchRecord } from '@/bench/readBenchRecord.js'
import { renderBench } from '@/bench/renderBench.js'
import { renderBenchJson } from '@/bench/renderBenchJson.js'
import { runBench } from '@/bench/runBench.js'
import { writeBenchRecord } from '@/bench/writeBenchRecord.js'
import type { PerfActionIo } from '@/commands/PerfActionIo.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'

export const perfBenchAction = ({
  io,
  config,
  target,
  session,
  json,
  record,
}: PerfActionIo): number => {
  const recorded = record ? undefined : readBenchRecord(io.root)
  const result = runBench(session, io.root, recorded, {
    perf: config.perf,
    disabled: config.disable,
  })
  if (record) {
    writeBenchRecord(io.root, {
      schemaVersion: 1,
      toolVersion: PACKAGE_VERSION,
      takenAt: new Date().toISOString(),
      host: target.host,
      entries: result.entries,
    })
    io.stdout(
      `recorded ${String(Object.keys(result.entries).length)} bench queries in ${BENCH_RECORD_FILENAME}\n`,
    )
    return ExitCode.OK
  }
  io.stdout(
    `${json ? renderBenchJson(result, recorded) : renderBench(result, recorded)}\n`,
  )
  return result.findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
}
