export function cruiseWorkspaceSelection(root, cwdOnly, discover) {
  if (typeof cwdOnly !== 'boolean')
    throw new TypeError('cwdOnly must be a validated boolean')
  return cwdOnly ? [root] : discover(root)
}
