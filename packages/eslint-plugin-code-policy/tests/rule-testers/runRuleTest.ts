import { RuleTester } from '@typescript-eslint/rule-tester'
import type { TSESLint } from '@typescript-eslint/utils'
import { afterAll, describe, it } from 'vitest'

// RuleTester drives its cases through the host test runner, which it reads
// from these statics. Assigning them once here is what lets every suite call
// a ready-made entry point instead of repeating the wiring.
RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

// typescript-eslint's tester, not ESLint core's: it is generic over the same
// RuleModule shape createRule() produces, so a rule passes straight through.
// Core's types its rule parameter as the untyped RuleDefinition shape, which
// is what used to force an `as any` cast in every suite. It also defaults to
// @typescript-eslint/parser, so no parser has to be resolved by hand.
const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Rule suites feed .tsx sources; without this they fail to parse.
      ecmaFeatures: { jsx: true },
    },
  },
})

/** Runs one rule's suite against the shared tester. */
export function runRuleTest<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  name: string,
  rule: TSESLint.RuleModule<MessageIds, Options>,
  tests: Parameters<typeof ruleTester.run<MessageIds, Options>>[2],
): void {
  ruleTester.run(name, rule, tests)
}
