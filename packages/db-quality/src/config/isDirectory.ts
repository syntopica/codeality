import { existsSync, statSync } from 'node:fs'

export const isDirectory = (path: string): boolean =>
  existsSync(path) && statSync(path).isDirectory()
