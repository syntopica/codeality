/// Directory names never walked: build output and dependency checkouts.
let defaultExcludes: Set<String> = [
  ".build", ".git", ".swiftpm", "build", "Carthage", "DerivedData", "node_modules", "Pods",
]
