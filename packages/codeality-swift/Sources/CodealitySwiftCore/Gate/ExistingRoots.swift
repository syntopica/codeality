import Foundation

/// The configured roots and test roots that exist on disk.
func existingRoots(_ projectRoot: String, _ config: SwiftConfig) -> [String] {
  (config.roots + config.testRoots).filter {
    FileManager.default.fileExists(
      atPath: URL(fileURLWithPath: projectRoot).appendingPathComponent($0).path)
  }
}
