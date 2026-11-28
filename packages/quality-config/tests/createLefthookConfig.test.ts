import { describe, expect, it } from 'vitest'

import { createLefthookConfig } from '../src/lefthook'

type Commands = Record<string, Record<string, unknown>>
const commands = (config: Record<string, unknown>) =>
  (config['pre-commit'] as { commands: Commands }).commands

describe('createLefthookConfig', () => {
  it('has no backlog handling by default', () => {
    expect(JSON.stringify(createLefthookConfig())).not.toContain('tadu')
    expect(createLefthookConfig({ tadu: false })).toEqual(
      createLefthookConfig(),
    )
  })

  it('excludes the backlog from file checks and validates it with tadu', () => {
    const preCommit = commands(createLefthookConfig({ tadu: true }))
    for (const name of ['lint:fast', 'lint', 'format']) {
      expect(preCommit[name].exclude).toContain('todo/**')
    }
    expect(preCommit.backlog).toEqual({
      glob: ['todo/**', 'TODO.md', 'TODO_LOG.md', 'TODO_HISTORY_INDEX.jsonl'],
      skip: [{ run: '! command -v tadu' }],
      run: 'tadu doctor .',
    })
  })
})
