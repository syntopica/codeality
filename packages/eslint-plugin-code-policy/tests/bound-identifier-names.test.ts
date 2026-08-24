import { parse } from '@typescript-eslint/parser'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { boundIdentifierNames } from '@/utils/bound-identifier-names.js'

const namesOf = (code: string): string[] => {
  const statement = parse(code).body[0]
  if (statement?.type !== AST_NODE_TYPES.VariableDeclaration) return []
  return statement.declarations.flatMap((declarator) =>
    boundIdentifierNames(declarator.id),
  )
}

describe('boundIdentifierNames', () => {
  it('returns the single name of a plain binding', () => {
    expect(namesOf('const a = source')).toEqual(['a'])
  })

  it('walks object patterns, including nesting and rest', () => {
    expect(namesOf('const { a, b: { c }, ...rest } = source')).toEqual([
      'a',
      'c',
      'rest',
    ])
  })

  it('walks array patterns, including holes and rest', () => {
    expect(namesOf('const [head, , ...tail] = source')).toEqual([
      'head',
      'tail',
    ])
  })

  it('looks through defaults', () => {
    expect(namesOf('const { a = 1 } = source')).toEqual(['a'])
  })

  it('returns nothing for a null pattern', () => {
    expect(boundIdentifierNames(null)).toEqual([])
  })
})
