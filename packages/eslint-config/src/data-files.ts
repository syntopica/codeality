import markdown from '@eslint/markdown'
import jsonc from 'eslint-plugin-jsonc'
import yml from 'eslint-plugin-yml'

/**
 * Correctness rules for the files that are not TypeScript.
 *
 * Prettier already makes JSON, YAML and Markdown *consistent*. Nothing made
 * them *correct*: a duplicate key in a JSON config silently wins or loses
 * depending on the parser, a YAML value that reads as a boolean because it is
 * spelled `no`, a Markdown link that points at a heading that was renamed.
 * None of that is a formatting question and none of it was caught anywhere in
 * the estate.
 *
 * Formatting rules are deliberately absent from all three sets - Prettier owns
 * layout, and a lint rule that disagrees with it produces a fight no one wins.
 *
 * Composed separately from `base` rather than added to it: these need their
 * own parsers, and a project that has no YAML should not pay for one.
 */
export const createDataFilesConfig = () => [
  ...jsonc.configs['flat/recommended-with-json'].map((config) => ({
    ...config,
    files: ['**/*.json'],
  })),
  ...jsonc.configs['flat/recommended-with-jsonc'].map((config) => ({
    ...config,
    files: ['**/*.jsonc', '**/tsconfig*.json', '**/.vscode/*.json'],
  })),
  {
    // JSON with comments, by TypeScript's own definition: `tsconfig.json` is
    // JSONC, and the block above sets the right parser for it but does not
    // undo the `no-comments` the plain-JSON set turned on for `**/*.json`.
    files: ['**/*.jsonc', '**/tsconfig*.json', '**/.vscode/*.json'],
    rules: { 'jsonc/no-comments': 'off' },
  },
  ...yml.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.{yml,yaml}'],
  })),
  {
    files: ['**/*.{yml,yaml}'],
    rules: {
      // `no`, `off`, `yes` and `on` are booleans in YAML 1.1 and strings in
      // 1.2, and which one a reader gets depends on the parser. GitHub Actions
      // reads `on:` as a key, Docker Compose does not. Quote the ambiguous
      // ones and the question stops existing.
      'yml/no-irregular-whitespace': 'error',
      'yml/require-string-key': 'error',
    },
  },
  ...markdown.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.md'],
  })),
  {
    files: ['**/*.md'],
    rules: {
      // A heading level that jumps from 2 to 4 breaks every table of contents
      // and every screen reader's outline. Both rules are structural, not
      // stylistic, which is why they are on and the rest of the set is not.
      'markdown/heading-increment': 'error',
      'markdown/no-empty-links': 'error',
      // Off: this repository's TODO files use `- [ ]` and `- [x]` task
      // checkboxes, which the rule reads as shortcut reference links to
      // undefined labels. Every hit is one of those, so the rule is pure
      // noise here rather than wrong in general.
      'markdown/no-missing-label-refs': 'off',
    },
  },
]
