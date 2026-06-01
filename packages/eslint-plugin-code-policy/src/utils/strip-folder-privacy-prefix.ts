// Next.js private folders carry a leading `_` (excluded from routing) but are
// semantically the same kind as their unprefixed name: `_hooks` is a hooks
// folder, `_utils` a utils folder. Normalize the prefix away before matching.
export function stripFolderPrivacyPrefix(segment: string): string {
  return segment.startsWith('_') ? segment.slice(1) : segment
}
