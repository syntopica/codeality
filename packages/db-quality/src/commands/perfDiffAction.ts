import type { PerfActionIo } from '@/commands/PerfActionIo.js'
import { ExitCode } from '@/model/ExitCode.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import { readPerfSnapshot } from '@/perf/readPerfSnapshot.js'
import { renderPerfDiff } from '@/perf/renderPerfDiff.js'
import { renderPerfDiffJson } from '@/perf/renderPerfDiffJson.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'

export const perfDiffAction = ({
  io,
  config,
  target,
  session,
  json,
}: PerfActionIo): number => {
  const previous = readPerfSnapshot(io.root)
  const current = takePerfSnapshot(
    session,
    config.perf,
    target.host,
    new Date().toISOString(),
  )
  const diff = diffSnapshots(previous, current, config.perf, config.disable)
  io.stdout(`${json ? renderPerfDiffJson(diff) : renderPerfDiff(diff)}\n`)
  return diff.findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
}
