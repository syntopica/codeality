import { parseProcessTable } from '@/measure/parseProcessTable.js'
import { treeRssKb } from '@/measure/treeRssKb.js'
import { RSS_SAMPLE_MS } from '@/model/RSS_SAMPLE_MS.js'
import { readProcessTable } from '@/tools/readProcessTable.js'

/**
 * Samples the memory of a process and everything under it until stopped;
 * `stop` returns the samples in MB.
 */
export const startRssSampler = (pid: number | undefined): (() => number[]) => {
  const samples: number[] = []
  const sample = (): void => {
    if (pid === undefined) return
    samples.push(treeRssKb(parseProcessTable(readProcessTable()), pid) / 1024)
  }
  // One sample at once, so a run shorter than the interval still has one.
  sample()
  const timer = setInterval(sample, RSS_SAMPLE_MS)
  return () => {
    clearInterval(timer)
    return samples
  }
}
