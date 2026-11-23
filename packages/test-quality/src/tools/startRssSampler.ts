import { descendantCount } from '@/measure/descendantCount.js'
import { parseProcessTable } from '@/measure/parseProcessTable.js'
import { treeRssKb } from '@/measure/treeRssKb.js'
import { RSS_SAMPLE_MS } from '@/model/RSS_SAMPLE_MS.js'
import type { TreeSamples } from '@/model/TreeSamples.js'
import { readProcessTable } from '@/tools/readProcessTable.js'

/**
 * Samples the memory and the process count of a process and everything under
 * it until stopped; `stop` returns the samples.
 */
export const startRssSampler = (
  pid: number | undefined,
): (() => TreeSamples) => {
  const samples: TreeSamples = { rssMb: [], descendants: [] }
  const sample = (): void => {
    if (pid === undefined) return
    const rows = parseProcessTable(readProcessTable())
    samples.rssMb.push(treeRssKb(rows, pid) / 1024)
    samples.descendants.push(descendantCount(rows, pid))
  }
  // One sample at once, so a run shorter than the interval still has one.
  sample()
  const timer = setInterval(sample, RSS_SAMPLE_MS)
  return () => {
    clearInterval(timer)
    return samples
  }
}
