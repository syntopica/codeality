/// Directory names never walked, at any depth: build output and dependency
/// checkouts.
let defaultExcludes: Set<String> = [
  ".build", ".git", ".swiftpm", "Carthage", "DerivedData", "node_modules", "Pods",
]
