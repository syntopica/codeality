import CodealitySwiftCore

/// Record the sections and say what was recorded; `create` refuses an
/// existing baseline.
func baselineWrite(root: String, sections: [String], overwrite: Bool) async throws {
    let existing = try readBaseline(projectRoot: root)
    if existing != nil && !overwrite {
        throw ConfigError("\(BaselineFile.fileName) already exists; use `baseline update`")
    }
    let baseline = try await recordSections(
        projectRoot: root, base: existing ?? BaselineFile(sections: [:]), sections: sections)
    try writeBaseline(projectRoot: root, baseline)
    let counts = sections.map { "\($0) \(baseline.section($0).values.reduce(0, +))" }
    print("recorded \(counts.joined(separator: ", ")) in \(root)/\(BaselineFile.fileName)")
}
