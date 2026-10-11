/**
 * The configuration files knip's Lefthook plugin reads, as of knip 6.41.
 * With one present, the plugin reports `lefthook` as used: under `CI` it adds
 * the package outright, and elsewhere it reads the installed `.git/hooks`,
 * which call the `lefthook` binary.
 */
export const LEFTHOOK_CONFIG_FILES: readonly string[] = [
  'lefthook.yml',
  'lefthook.yaml',
  'lefthook.json',
  'lefthook.jsonc',
  'lefthook.toml',
  '.lefthook.yml',
  '.lefthook.yaml',
  '.lefthook.json',
  '.lefthook.jsonc',
  '.lefthook.toml',
  '.config/lefthook.yml',
  '.config/lefthook.yaml',
  '.config/lefthook.json',
  '.config/lefthook.jsonc',
  '.config/lefthook.toml',
]
