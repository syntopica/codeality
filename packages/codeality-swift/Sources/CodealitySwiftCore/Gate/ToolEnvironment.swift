import Foundation

/// This process's environment with [overrides] applied.
func toolEnvironment(_ overrides: [String: String]?) -> [String: String] {
  ProcessInfo.processInfo.environment.merging(overrides ?? [:]) { _, override in override }
}
