import { readWorkflows } from '../conformance/readWorkflows.mjs'
import { repositoryRoot } from '../python/repositoryRoot.mjs'

/** Everything the Swift conformance checks read, gathered once. */
export async function loadSwiftContext(root, versions) {
  const workflows = await readWorkflows(await repositoryRoot(root))
  return {
    root,
    versions,
    workflows,
    codealityWorkflow:
      workflows.find((w) => w.name === 'codeality.yml')?.text ?? '',
  }
}
