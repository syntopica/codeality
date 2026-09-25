import { describe, expect, it } from 'vitest'

import { redactConnectionSecrets } from '@/postgres/redactConnectionSecrets.js'

describe('redactConnectionSecrets', () => {
  it('replaces the password in a url with the password', () => {
    expect(redactConnectionSecrets('postgres://u:secret@h/d')).toBe(
      'postgres://u:***@h/d',
    )
  })
  it('leaves a url with no password unchanged', () => {
    expect(redactConnectionSecrets('postgres://u@h/d')).toBe('postgres://u@h/d')
  })
  it('leaves plain text unchanged', () => {
    expect(redactConnectionSecrets('connection refused')).toBe(
      'connection refused',
    )
  })
  it('redacts two urls in one line', () => {
    expect(
      redactConnectionSecrets(
        'from postgres://a:one@h1/d to postgres://b:two@h2/d',
      ),
    ).toBe('from postgres://a:***@h1/d to postgres://b:***@h2/d')
  })
})
