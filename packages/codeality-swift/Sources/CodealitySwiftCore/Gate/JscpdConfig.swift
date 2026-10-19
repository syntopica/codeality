/// The jscpd configuration for a Swift project: the shared defaults, the
/// project's overrides, and the generated globs.
func jscpdConfig(_ config: SwiftConfig, outputDirectory: String) -> [String: Any] {
  [
    "minTokens": config.duplicatesMinTokens ?? JscpdDefaults.minTokens,
    "format": ["swift"],
    "gitignore": true,
    "ignore": JscpdDefaults.ignore + config.generated + config.exclude,
    "reporters": ["json"],
    "output": outputDirectory,
    "silent": true,
  ]
}
