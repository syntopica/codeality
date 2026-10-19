import { relative, resolve } from 'node:path'

import { readWorkflows } from '../conformance/readWorkflows.mjs'
import { readText } from '../estate/readText.mjs'
import { repositoryRoot } from '../python/repositoryRoot.mjs'
import { dartJobId } from './dartJobId.mjs'

/**
 * Everything the Dart conformance checks read, gathered once. Workflows
 * come from the enclosing repository: the root codeality.yml holds one job
 * per pubspec project.
 */
export async function loadDartContext(root, versions) {
  const repoRoot = await repositoryRoot(root)
  const projectPath = relative(repoRoot, root) || '.'
  const workflows = await readWorkflows(repoRoot)
  return {
    root,
    versions,
    projectPath,
    jobId: dartJobId(projectPath),
    pubspec: await readText(resolve(root, 'pubspec.yaml')),
    workflows,
    codealityWorkflow:
      workflows.find((w) => w.name === 'codeality.yml')?.text ?? '',
  }
}
