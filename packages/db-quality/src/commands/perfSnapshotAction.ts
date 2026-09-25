import type { PerfActionIo } from '@/commands/PerfActionIo.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import { writePerfSnapshot } from '@/perf/writePerfSnapshot.js'

export const perfSnapshotAction = ({
  io,
  config,
  target,
  session,
}: PerfActionIo): number => {
  const snapshot = takePerfSnapshot(
    session,
    config.perf,
    target.host,
    new Date().toISOString(),
  )
  writePerfSnapshot(io.root, snapshot)
  io.stdout(
    `recorded ${String(snapshot.statements.length)} statements and ${String(snapshot.tables.length)} tables from ${target.host} in ${PERF_SNAPSHOT_FILENAME}\n`,
  )
  return ExitCode.OK
}
