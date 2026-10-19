/// Load and validate `codeality-swift.yaml` from [projectRoot].
public func loadConfig(projectRoot: String) throws -> SwiftConfig {
  let document = try readConfigDocument(projectRoot: projectRoot)
  try rejectUnknownKeys(document)
  let read = ConfigReader(document: document)
  let schemaVersion = try read.integer("schema-version", supportedSchemaVersion)
  guard schemaVersion == supportedSchemaVersion else {
    throw ConfigError(
      "\(configFileName) has schema-version \(schemaVersion); this release reads "
        + "schema-version \(supportedSchemaVersion)")
  }
  let roots = try read.strings("roots", [])
  guard !roots.isEmpty else {
    throw ConfigError("\(configFileName) must list the Swift source directories under roots")
  }
  return SwiftConfig(
    schemaVersion: schemaVersion,
    roots: roots,
    testRoots: try read.strings("test-roots", []),
    maxFileLines: try read.integer("limits.max-file-lines", 150),
    testMaxFileLines: try read.integer("limits.test-max-file-lines", 300),
    entrypoint: try read.strings("roles.entrypoint", []),
    generated: defaultGeneratedGlobs + (try read.strings("roles.generated", [])),
    exclude: try read.strings("exclude", []),
    duplicatesMinTokens: try read.optionalInteger("duplicates.min-tokens"),
    duplicatesThreshold: try read.optionalNumber("duplicates.threshold")
  )
}
