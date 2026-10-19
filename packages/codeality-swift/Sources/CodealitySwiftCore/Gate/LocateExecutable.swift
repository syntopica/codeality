import Foundation

/// The absolute path of [name] on the PATH of [environment], or nil.
func locateExecutable(_ name: String, environment: [String: String]) -> String? {
  if name.contains("/") { return FileManager.default.isExecutableFile(atPath: name) ? name : nil }
  return (environment["PATH"] ?? "").split(separator: ":").map { "\($0)/\(name)" }
    .first { FileManager.default.isExecutableFile(atPath: $0) }
}
