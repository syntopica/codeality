/// BSW004: cap occupied lines per file.
struct MaxFileLines: Rule {
  let code = RuleCode.bsw004

  func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] {
    let limit = file.role == .test ? config.testMaxFileLines : config.maxFileLines
    let count = countCodeLines(file)
    guard count > limit else { return [] }
    return [
      Finding(
        code: code, message: "\(count) code lines, over the limit of \(limit); split the file",
        location: Location(file.path, 1, 1), subject: "\(count)")
    ]
  }
}
