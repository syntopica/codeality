// Run with node in the audited project's root. Loads the project's own vitest
// config through the vitest node API and prints one JSON array: every test
// file the suite would run, with the project that runs it and that project's
// environment. Nothing is executed. A file listed twice runs twice.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { cwd, stdout } from 'node:process'
import { pathToFileURL } from 'node:url'

const require = createRequire(join(cwd(), 'package.json'))
const { createVitest } = await import(
  pathToFileURL(require.resolve('vitest/node')).href
)
const vitest = await createVitest('test', { watch: false }, {}, {})
try {
  const specifications = await vitest.globTestSpecifications()
  const files = specifications.map((specification) => ({
    file: specification.moduleId,
    project: specification.project.name,
    environment: specification.project.config.environment,
  }))
  stdout.write(`${JSON.stringify(files)}\n`)
} finally {
  await vitest.close()
}
