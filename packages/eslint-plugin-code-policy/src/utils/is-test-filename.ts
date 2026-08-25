// Whether a path is test code, by the same shape `@busirocket/eslint-config`
// uses to scope its testing rules: a `*.test.*` / `*.spec.*` file, or anything
// under `__tests__/`, `tests/` or `test/`.
//
// Placement rules must not fire here. A test is named after the unit it
// covers - `selectManagedPlans.test.ts` tests a selector, it is not one - so
// reading its name as a kind demands it move into `selectors/`, away from the
// code it tests. This only started mattering when eslint-config 0.7.0 gave
// test files real rules instead of a blanket exemption.
export function isTestFilename(filename: string): boolean {
  const path = filename.replaceAll('\\', '/')
  return (
    /\.(?:test|spec)\.[mc]?[jt]sx?$/.test(path) ||
    /(?:^|\/)(?:__tests__|tests|test)\//.test(path)
  )
}
