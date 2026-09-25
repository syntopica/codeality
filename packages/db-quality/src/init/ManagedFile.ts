import type { PlanDisposition } from '@/init/PlanDisposition.js'

export type ManagedFile = {
  path: string
  disposition: PlanDisposition
  detail: string
  content?: string
}
