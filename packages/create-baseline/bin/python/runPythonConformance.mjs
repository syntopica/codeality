import { checkActionPins } from '../conformance/checkActionPins.mjs'
import { checkGateWorkflow } from './checkGateWorkflow.mjs'
import { checkLockPin } from './checkLockPin.mjs'
import { checkQualityGroup } from './checkQualityGroup.mjs'
import { loadPythonContext } from './loadPythonContext.mjs'

const CHECKS = [
  checkQualityGroup,
  checkGateWorkflow,
  checkActionPins,
  checkLockPin,
]

/**
 * Whether a Python project's gate is wired, not merely installed.
 *
 * The same question `runConformance` asks of a JavaScript repository, with
 * the answers read from pyproject.toml, uv.lock and the workflows. The
 * findings share the JavaScript ids where the check is the same
 * (`action-pin:*`) and carry a `py-` prefix where it is not.
 */
export async function runPythonConformance(root, versions) {
  const context = await loadPythonContext(root, versions)
  return { context, findings: CHECKS.flatMap((check) => check(context)) }
}
