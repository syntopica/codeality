// Mirrors createCommitlintConfig() in @busirocket/quality-config/commitlint.
// commitlint reads a config file, not a TypeScript factory, so this file is
// the shape that factory produces - see it for the rationale behind each
// deviation from the conventional preset.
export default {
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
}
