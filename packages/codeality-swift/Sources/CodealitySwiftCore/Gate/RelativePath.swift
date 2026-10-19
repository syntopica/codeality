import Foundation

/// [path] relative to [root], both with symlinks resolved (macOS temp and
/// home directories are symlinks); [path] unchanged when outside [root].
func relativePath(_ path: String, to root: String) -> String {
  let resolvedPath = URL(fileURLWithPath: path).resolvingSymlinksInPath().path
  let resolvedRoot = URL(fileURLWithPath: root).resolvingSymlinksInPath().path + "/"
  return resolvedPath.hasPrefix(resolvedRoot)
    ? String(resolvedPath.dropFirst(resolvedRoot.count)) : path
}
