import { spawnSync } from 'node:child_process'

export function spawnCruise(command, args, workspace, configPath) {
  return spawnSync(command, [...args, '--ts-config', configPath], {
    cwd: workspace,
    stdio: 'inherit',
  })
}
