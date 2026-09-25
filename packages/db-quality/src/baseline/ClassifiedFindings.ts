import type { Finding } from '@/model/Finding.js'

export type ClassifiedFindings = {
  new: Finding[]
  known: Finding[]
  resolved: string[]
}
