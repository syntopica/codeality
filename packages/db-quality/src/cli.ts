import { argv, exit, stdout } from 'node:process'

import { PACKAGE_VERSION } from '@/packageVersion.js'

if (argv.includes('--version')) {
  stdout.write(`codeality-db ${PACKAGE_VERSION}\n`)
  exit(0)
}
stdout.write('codeality-db: no command yet\n')
exit(2)
