import type { CommandRunner } from '@/tools/CommandRunner.js'

/**
 * Runs the project's own Prettier over files this tool just wrote, so a
 * consumer whose pre-commit runs `prettier --check` accepts them as written.
 * Its config and `.prettierignore` decide the shape; without Prettier, or when
 * it fails, the files stay as written.
 */
export const runProjectPrettier = (
  runner: CommandRunner,
  root: string,
  paths: string[],
): void => {
  if (paths.length === 0) return
  runner(
    'prettier',
    ['--write', '--ignore-unknown', '--log-level', 'silent', ...paths],
    { cwd: root },
  )
}
