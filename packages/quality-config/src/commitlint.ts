/** Shape of a commitlint configuration document. */
type CommitlintConfig = Record<string, unknown>

/**
 * Conventional-commit rules for the `commit-msg` hook.
 *
 * The release process already depends on this convention: `brp-release`
 * derives the semver bump and the changelog from the commit subjects, so a
 * subject typed `feature:` instead of `feat:` silently drops a change out of
 * the release notes and can flip a minor into a patch. Nothing verified it -
 * the convention was upheld by hand, in the one place where a typo is
 * invisible until the release is already cut.
 *
 * Deliberately not the full `config-conventional` preset. Two of its rules
 * fight the way commits are actually written here:
 *
 * - `body-max-line-length` at 100 rejects a pasted stack trace or a URL,
 *   which is exactly the context worth keeping in a commit body.
 * - `subject-case` forbids a subject starting with an identifier that is
 *   capitalised in the code (`TypeScript`, `ESLint`, `GitHub`).
 *
 * `type-enum` is the load-bearing rule and it is an error: it is the field the
 * release tooling reads.
 */
export const createCommitlintConfig = (): CommitlintConfig => ({
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
})
