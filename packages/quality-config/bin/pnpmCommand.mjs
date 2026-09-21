// How to spawn pnpm from a Node program, on a machine where `pnpm` on PATH is
// not executable by the kernel.
//
// pnpm 11 puts a shebang-less `sh` script at its bin path and replaces it with
// the native binary during installation. The file says so itself: a bin shim
// and a shell both retry it under `sh`, "Apple's libc does not, so on macOS a
// program that spawns this path itself gets ENOEXEC". A Homebrew install that
// never ran that replacement leaves the placeholder in place, and then every
// `spawnSync('pnpm', ...)` here fails with `spawnSync pnpm ENOEXEC` - measured
// on 2026-09-21, where it surfaced as `type-coverage: FAIL .` with no output
// on a repository at 99.82% coverage, and as `baseline-dupes: could not run
// jscpd`. The gate reported the subject as broken when the subject was fine.
//
// So the runner resolves an entry point Node can always execute:
//   1. `npm_execpath`, which pnpm sets for its own scripts and which points at
//      a JavaScript file, run under this Node.
//   2. otherwise the `pnpm` on PATH, if the kernel can exec it - a shebang or
//      a real binary.
//   3. otherwise the `bin/pnpm.mjs` the placeholder itself hands over to.
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import { env, execPath, platform } from 'node:process'

const JS_ENTRY = /\.[cm]?js$/

/**
 * The argv prefix that runs pnpm: `[command, ...leadingArguments]`.
 * @returns {[string, ...string[]]} Spread it ahead of pnpm's own arguments.
 */
export function pnpmCommand() {
  const fromNpm = env.npm_execpath
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fromNpm && JS_ENTRY.test(fromNpm) && existsSync(fromNpm)) {
    return [execPath, fromNpm]
  }
  const onPath = resolveOnPath('pnpm')
  if (!onPath) return ['pnpm']
  if (isKernelExecutable(onPath)) return ['pnpm']
  /* eslint-disable security/detect-non-literal-fs-filename */
  const handover = join(dirname(realpathSync(onPath)), 'bin', 'pnpm.mjs')
  return existsSync(handover) ? [execPath, handover] : ['pnpm']
  /* eslint-enable security/detect-non-literal-fs-filename */
}

/** The first `name` on PATH, or undefined. Windows keeps its own extensions. */
function resolveOnPath(name) {
  const suffixes = platform === 'win32' ? ['.cmd', '.exe', '.bat', ''] : ['']
  for (const directory of (env.PATH ?? '').split(delimiter).filter(Boolean)) {
    for (const suffix of suffixes) {
      const candidate = join(directory, `${name}${suffix}`)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return candidate
      }
    }
  }
  return undefined
}

/** Whether `execve` can run this file: a shebang, or anything not plain text. */
function isKernelExecutable(path) {
  if (platform === 'win32') return true
  let head
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    head = readFileSync(path).subarray(0, 2)
  } catch {
    return true
  }
  if (head[0] === 0x23 && head[1] === 0x21) return true
  // Mach-O, ELF and the fat binaries macOS ships all start outside printable
  // ASCII: not text, so not the placeholder. Only a text file without a
  // shebang is the case this exists for.
  return head[0] >= 0x7f
}
