import { describe, expect, it } from 'vitest'

import { qualifiedName } from '@/sql/qualifiedName.js'

describe('qualifiedName', () => {
  const users = 'public.users'
  it.each([
    [users, users],
    ['"public"."Users"', users],
    ['Users', users],
    ['auth.users', 'auth.users'],
  ])('%s -> %s', (raw, expected) => {
    expect(qualifiedName(raw)).toBe(expected)
  })
})
