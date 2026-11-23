import { relative } from 'node:path'

import { readWorkflows } from '../conformance/readWorkflows.mjs'
import { repositoryRoot } from '../python/repositoryRoot.mjs'
import { goJobId } from './goJobId.mjs'

/** Everything the Go conformance checks read, gathered once. */
export async function loadGoContext(root, versions) {
  const repository = await repositoryRoot(root)
  const workflows = await readWorkflows(repository)
  return {
    root,
    versions,
    workflows,
    jobId: goJobId(relative(repository, root).replaceAll('\\', '/')),
    codealityWorkflow:
      workflows.find((w) => w.name === 'codeality.yml')?.text ?? '',
  }
}
