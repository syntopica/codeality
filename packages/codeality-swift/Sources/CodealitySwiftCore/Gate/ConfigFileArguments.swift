import Foundation

/// `[flag, path]` when [name] exists at the project root, else nothing.
func configFileArguments(_ projectRoot: String, _ flag: String, _ name: String) -> [String] {
  let path = URL(fileURLWithPath: projectRoot).appendingPathComponent(name).path
  return FileManager.default.fileExists(atPath: path) ? [flag, path] : []
}
