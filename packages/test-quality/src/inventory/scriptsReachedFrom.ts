import { SCRIPT_REFERENCE } from '@/model/SCRIPT_REFERENCE.js'

/** Every package script a command reaches, following scripts that call scripts. */
export const scriptsReachedFrom = (
  commands: string[],
  scripts: Record<string, string>,
): string[] => {
  const reached = new Set<string>()
  const pending = [...commands]
  for (
    let command = pending.pop();
    command !== undefined;
    command = pending.pop()
  ) {
    for (const match of command.matchAll(SCRIPT_REFERENCE)) {
      const name = match[1] ?? ''
      const body = scripts[name]
      if (body === undefined || reached.has(name)) continue
      reached.add(name)
      pending.push(body)
    }
  }
  return [...reached]
}
