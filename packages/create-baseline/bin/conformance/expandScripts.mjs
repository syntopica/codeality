// A script reference inside another script's command line, in every form the
// adopting repos actually use: `pnpm x`, `pnpm run x`, `npm run x`,
// `yarn x`, `bun run x`, and `turbo run x y z` (which names several at once).
const RUN_REFERENCE = /\b(?:pnpm|npm|yarn|bun)\s+(?:run\s+)?([a-z][\w:-]*)/g
const TURBO_REFERENCE =
  /\b(?:turbo|nx)\s+run\s+((?:[a-z][\w:-]*\s+)*[a-z][\w:-]*)/g

// A local file a script hands the work to instead of chaining the steps
// inline: `node scripts/check-quality.mjs`, `bash scripts/ci.sh`, `./run.sh`.
const RUNNER_FILE =
  /(?:\bnode\s+|\bbash\s+|\bsh\s+|\B)([\w./-]+\.(?:mjs|cjs|js|ts|sh))\b/g

/**
 * Everything reachable from `entries`: the set of script names, and the
 * concatenated text of their commands.
 *
 * Three kinds of reference are followed, because all three are in use across
 * the estate:
 *
 * - another script, which is how half the repositories compose their gates
 *   (`check:ci` calls `check:all` calls `lint`);
 * - a `turbo run <task>` target, recorded as reached even when the root
 *   defines no script by that name - in a monorepo the task lives in each
 *   workspace's manifest, and requiring it at the root would report every
 *   monorepo as missing the gates it actually runs;
 * - a local runner file named in `runners`, whose text is read as though it
 *   were part of the command. The baseline repo's own `check:quality` is
 *   `node scripts/check-quality.mjs`, a step runner that exists so a failure
 *   names the gate that produced it; without following it into the file, the
 *   reference implementation reports its own gates as uninvoked.
 *
 * Both halves of the return value are needed downstream: a gate can be
 * invoked as a script (`pnpm knip`) or as a bare tool (`depcruise src`).
 */
export function expandScripts(scripts, entries, runners = {}) {
  const names = new Set()
  const commands = []
  const queue = entries.filter((name) => Object.hasOwn(scripts, name))
  const readRunners = new Set()

  const follow = (command) => {
    commands.push(command)

    for (const match of command.matchAll(RUN_REFERENCE)) {
      const target = match[1]
      if (Object.hasOwn(scripts, target) && !names.has(target)) {
        queue.push(target)
      }
    }
    for (const match of command.matchAll(TURBO_REFERENCE)) {
      for (const target of match[1].trim().split(/\s+/)) {
        if (names.has(target)) continue
        if (Object.hasOwn(scripts, target)) queue.push(target)
        else names.add(target)
      }
    }
    for (const match of command.matchAll(RUNNER_FILE)) {
      const path = match[1].replace(/^\.\//, '')
      if (readRunners.has(path) || !Object.hasOwn(runners, path)) continue
      readRunners.add(path)
      follow(runners[path])
    }
  }

  while (queue.length) {
    const name = queue.shift()
    if (names.has(name)) continue
    names.add(name)

    const command = scripts[name]
    if (!command) continue
    follow(command)
  }

  return { names, text: commands.join(' && ') }
}
