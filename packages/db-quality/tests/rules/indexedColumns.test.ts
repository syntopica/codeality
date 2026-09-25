import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { indexedColumns } from '@/rules/indexedColumns.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const sql = readFileSync(
  new URL('../fixtures/migrations/indexes.sql', import.meta.url),
  'utf8',
)

describe('indexedColumns', () => {
  const knowledge = indexedColumns(migrationSetFrom({ 'm/a.sql': sql }))
  it('collects inline keys, table constraints, create index and alter table', () => {
    const orders = knowledge.get('public.orders')
    expect([...(orders?.indexed ?? [])].sort()).toEqual([
      'created_at',
      'email',
      'id',
      'organization_id',
    ])
    expect([...(orders?.unique ?? [])].sort()).toEqual([
      'email',
      'id',
      'organization_id',
    ])
  })
  it('ignores expression indexes and records gin indexes by their column', () => {
    const notes = knowledge.get('public.notes')
    expect([...(notes?.indexed ?? [])].sort()).toEqual(['body', 'id'])
    expect([...(notes?.unique ?? [])].sort()).toEqual(['body', 'id'])
  })
  it('lower-cases quoted identifiers', () => {
    const quoted = knowledge.get('public.quoted')
    expect([...(quoted?.indexed ?? [])].sort()).toEqual(['id', 'ownerid'])
  })
  it('knows a created table with no index at all', () => {
    const set = migrationSetFrom({
      'm/b.sql': 'create table public.bare (a int);',
    })
    expect(indexedColumns(set).get('public.bare')).toEqual({
      indexed: new Set(),
      unique: new Set(),
    })
  })
})
