import { runCruiseProbe } from './runCruiseProbe'

export function runDevDependencyProbe(root: string) {
  return runCruiseProbe(
    root,
    `
    const result = spawnSync(process.execPath, [detector, 'packages/app/src', '--config', '.dependency-cruiser.json', '--output-type', 'json'], { cwd: root, encoding: 'utf8' });
    if (result.error || result.status !== 0) throw Error(result.stderr || String(result.error));
    process.stdout.write(result.stdout);
    `,
  )
}
