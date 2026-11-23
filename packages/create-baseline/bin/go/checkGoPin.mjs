import { pinFinding } from '../estate/pinFinding.mjs'

const INSTALL = /cmd\/codeality-go@(\S+)/
const VERSION = /^v(\d+\.\d+\.\d+)$/

/**
 * The go job installs codeality-go with `go install ...@v<version>`; it must
 * be the current release. `latest`, a branch or a SHA is reported as not
 * released.
 */
export function checkGoPin({ codealityWorkflow, versions }) {
  const current = versions['codeality-go']
  const ref = INSTALL.exec(codealityWorkflow ?? '')?.[1]
  if (!current || !ref) return []
  return pinFinding(
    'go',
    'codeality-go',
    VERSION.exec(ref)?.[1] ?? ref,
    current,
  )
}
