import { argv, cwd, exit, stderr, stdout } from 'node:process'

import { runCli } from '@/cli/runCli.js'

exit(
  await runCli(argv.slice(2), {
    root: cwd(),
    stdout: (text) => {
      stdout.write(text)
    },
    stderr: (text) => {
      stderr.write(text)
    },
  }),
)
