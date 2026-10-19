import { pinFinding } from '../estate/pinFinding.mjs'

const CHECKOUT = 'repository: syntopica/codeality'
const REF = /ref:\s*['"]?([^\s'"#]+)/
const TAG = /^codeality-swift-v(\d+\.\d+\.\d+)$/

/**
 * The swift job builds codeality-swift from a release tag; it must be the
 * current one. A branch or SHA is reported as not released.
 */
export function checkSwiftPin({ codealityWorkflow, versions }) {
  const current = versions['codeality-swift']
  const at = (codealityWorkflow ?? '').indexOf(CHECKOUT)
  if (!current || at === -1) return []
  const ref = REF.exec(codealityWorkflow.slice(at))?.[1] ?? null
  return pinFinding(
    'swift',
    'codeality-swift',
    TAG.exec(ref ?? '')?.[1] ?? ref,
    current,
  )
}
