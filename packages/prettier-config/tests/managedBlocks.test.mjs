import assert from 'node:assert/strict'
import { test } from 'node:test'
import { format } from 'prettier'
import base from '../base.mjs'

const block = [
  '<!-- BEGIN:turborepo-agent-rules -->',
  '',
  '# This is NOT the Turborepo you know',
  '',
  'Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data.  Keep  *this*  verbatim.',
  '<!-- END:turborepo-agent-rules -->',
].join('\n')

const long =
  'A line outside any managed block that is longer than eighty columns and so must wrap.'

// `format` does not apply `overrides`, so pass the Markdown one directly.
const formatMarkdown = (text, filepath = 'AGENTS.md') =>
  format(text, { ...base, proseWrap: 'always', filepath })

test('keeps a BEGIN/END block byte for byte', async () => {
  const output = await formatMarkdown(`# Guide\n\n${block}\n`)
  assert.ok(output.includes(block))
})

test('wraps prose outside the block in AGENTS.md', async () => {
  const output = await formatMarkdown(`${long}\n\n${block}\n\n${long}\n`)
  assert.equal(output.split(long).length, 1)
  assert.ok(output.includes(block))
})

test('is idempotent', async () => {
  const once = await formatMarkdown(`${long}\n\n${block}\n`)
  assert.equal(await formatMarkdown(once), once)
})

test('formats an unclosed BEGIN like any other Markdown', async () => {
  const output = await formatMarkdown(
    `<!-- BEGIN:orphan -->\n\n${long}\n`,
    'README.md',
  )
  assert.equal(output.split(long).length, 1)
})

test('ignores an END that closes a different block', async () => {
  const output = await formatMarkdown(
    `<!-- BEGIN:one -->\n\n${long}\n\n<!-- END:two -->\n`,
  )
  assert.equal(output.split(long).length, 1)
})
