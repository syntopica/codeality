import type { Finding } from '@/model/Finding.js'

export type CheckResult = {
  findings: Finding[]
  screens: { route: string; screen: string; screenshot: string }[]
}
