import { argv, cwd, exit, stderr, stdout } from 'node:process'

import { runCli } from '@/cli/runCli.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

exit(
  runCli(argv.slice(2), {
    root: cwd(),
    runner: spawnRunner,
    stdout: (text) => {
      stdout.write(text)
    },
    stderr: (text) => {
      stderr.write(text)
    },
  }),
)
