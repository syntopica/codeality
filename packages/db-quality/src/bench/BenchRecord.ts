import type { BenchEntry } from '@/bench/BenchEntry.js'

export type BenchRecord = {
  schemaVersion: 1
  toolVersion: string
  takenAt: string
  host: string
  entries: Record<string, BenchEntry>
}
