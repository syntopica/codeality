/// `*Tests.swift`, anything under a `Tests` directory, or under a test root.
func isTestPath(_ path: String, _ config: SwiftConfig) -> Bool {
  let components = path.split(separator: "/")
  return path.hasSuffix("Tests.swift")
    || components.dropLast().contains("Tests")
    || config.testRoots.contains { path.hasPrefix($0 + "/") }
}
