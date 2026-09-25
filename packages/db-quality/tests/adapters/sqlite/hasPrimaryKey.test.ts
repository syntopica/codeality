import { describe, expect, it } from 'vitest'

import { hasPrimaryKey } from '@/adapters/sqlite/hasPrimaryKey.js'

describe('hasPrimaryKey', () => {
  it.each([
    ['CREATE TABLE a (id INTEGER PRIMARY KEY)', true],
    ['create table b (x int, y int, primary key (x, y))', true],
    ['CREATE VIRTUAL TABLE fts USING fts5(body)', true],
    ['CREATE TABLE c (x int)', false],
  ])('%s -> %s', (sql, expected) => {
    expect(hasPrimaryKey(sql)).toBe(expected)
  })
})
