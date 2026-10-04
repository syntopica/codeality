import type { ChildProcess } from 'node:child_process'

/** The child's exit code once it closes; -1 when it never started. */
export const waitForExit = async (child: ChildProcess): Promise<number> =>
  new Promise<number>((resolve) => {
    child.on('close', (code) => {
      resolve(code ?? -1)
    })
    child.on('error', () => {
      resolve(-1)
    })
  })
