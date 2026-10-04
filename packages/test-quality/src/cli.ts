import process, { argv, cwd, stderr, stdout } from 'node:process'

import { runCli } from '@/cli/runCli.js'
import { collectInventory } from '@/tools/collectInventory.js'
import { readTextFile } from '@/tools/readTextFile.js'
import { runVitestMeasured } from '@/tools/runVitestMeasured.js'

process.exitCode = await runCli(argv.slice(2), {
  root: cwd(),
  stdout: (text) => {
    stdout.write(text)
  },
  stderr: (text) => {
    stderr.write(text)
  },
  readText: readTextFile,
  inventory: collectInventory,
  runVitest: runVitestMeasured,
})
