/// BSW000 for a file the parser could not read cleanly, or nil.
func parseErrorFinding(_ file: SourceFile) -> Finding? {
  guard let first = file.parseErrors.first else { return nil }
  return Finding(
    code: .bsw000, message: "file does not parse: \(first.message)",
    location: Location(file.path, first.line, first.column))
}
