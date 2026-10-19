/// The jscpd configuration for a Swift project: the shared defaults, the
/// project's overrides, and the generated globs.
func jscpdConfig(_ config: SwiftConfig, outputDirectory: String) -> [String: Any] {
  [
    "minTokens": config.duplicatesMinTokens ?? JscpdDefaults.minTokens,
    "format": ["swift"],
    "gitignore": true,
    // Absolute names, made project-relative by parseJscpdReport: jscpd
    // otherwise names files relative to the root it scanned.
    "absolute": true,
    "ignore": JscpdDefaults.ignore + config.generated + config.exclude,
    "reporters": ["json"],
    "output": outputDirectory,
    "silent": true,
  ]
}
