import { describe, expect, it } from 'vitest'

import { checkCiWorkflow } from '../bin/conformance/checkCiWorkflow.mjs'

const ON_PUSH = {
  name: 'ci.yml',
  text: 'on:\n  push:\n    branches: [main]\n',
}

describe('checkCiWorkflow', () => {
  it('passes a workflow that fires on push', () => {
    expect(checkCiWorkflow({ workflows: [ON_PUSH] })).toEqual([])
  })

  it('passes a workflow that fires on pull request', () => {
    const text = 'on:\n  pull_request:\n    branches: [main]\n'
    expect(checkCiWorkflow({ workflows: [{ name: 'ci.yml', text }] })).toEqual(
      [],
    )
  })

  // Eight of seventeen adopters, every one with the full gate set installed as
  // scripts and nothing running them.
  it('reports a repository with no workflow at all', () => {
    const [finding] = checkCiWorkflow({ workflows: [] })
    expect(finding.id).toBe('ci-workflow')
    expect(finding.fix).toEqual({ kind: 'write-workflow' })
  })

  // A pipeline nobody triggers is not a gate.
  it('reports a pipeline that only runs manually or on a schedule', () => {
    const text =
      'on:\n  workflow_dispatch:\n  schedule:\n    - cron: "0 3 * * *"\n'
    const [finding] = checkCiWorkflow({
      workflows: [{ name: 'nightly.yml', text }],
    })
    expect(finding.message).toContain('push or pull request')
    // Nothing is written over an existing pipeline; that needs a human.
    expect(finding.fix).toBeUndefined()
  })

  it('accepts the trigger living in any one of several workflows', () => {
    const workflows = [
      { name: 'nightly.yml', text: 'on:\n  schedule:\n' },
      ON_PUSH,
    ]
    expect(checkCiWorkflow({ workflows })).toEqual([])
  })
})
