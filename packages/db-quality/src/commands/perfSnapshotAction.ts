import type { PerfActionIo } from '@/commands/PerfActionIo.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import { writePerfSnapshot } from '@/perf/writePerfSnapshot.js'
import { runProjectPrettier } from '@/tools/runProjectPrettier.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'

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
  runProjectPrettier(io.runner, io.root, [PERF_SNAPSHOT_FILENAME])
  io.stdout(
    `recorded ${String(snapshot.statements.length)} statements and ${String(snapshot.tables.length)} tables from ${target.host} in ${PERF_SNAPSHOT_FILENAME}\n`,
  )
  return ExitCode.OK
}
