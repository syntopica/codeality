import parser from '@typescript-eslint/parser'
import type { TSESLint } from '@typescript-eslint/utils'
import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

// RuleTester drives its cases through the host test runner, which it reads
// from these statics. They are supported at runtime but absent from the
// public type signature, hence the narrow structural view rather than `any`.
const runnerHooks = RuleTester as unknown as {
  afterAll: typeof afterAll
  describe: typeof describe
  it: typeof it
}
runnerHooks.afterAll = afterAll
runnerHooks.describe = describe
runnerHooks.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Rule suites feed .tsx sources; without this they fail to parse.
      ecmaFeatures: { jsx: true },
    },
  },
})

type RuleTestCases = Parameters<RuleTester['run']>[2]
type UntypedRule = Parameters<RuleTester['run']>[1]

/**
 * Runs one rule's suite against the shared tester.
 *
 * Core's RuleTester types its rule parameter as the untyped RuleDefinition
 * shape, while createRule() produces a typed TSESLint RuleModule. They are the
 * same object at runtime, so the mismatch is a typing gap, not a real one -
 * this function is where it is absorbed, once, instead of in every suite.
 */
export function runRuleTest<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  name: string,
  rule: TSESLint.RuleModule<MessageIds, Options>,
  tests: RuleTestCases,
): void {
  ruleTester.run(name, rule as unknown as UntypedRule, tests)
}
