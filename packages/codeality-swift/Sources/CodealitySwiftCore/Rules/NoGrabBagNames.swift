/// BSW003: no `Utils`, `Helpers`, `Misc` or `Common` as a directory segment
/// or file stem, in any case.
struct NoGrabBagNames: Rule {
    let code = RuleCode.bsw003

    func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] {
        var segments = file.path.split(separator: "/").map(String.init)
        let stem = segments.removeLast().replacingOccurrences(of: ".swift", with: "")
        return (segments + [stem]).filter { grabBagNames.contains($0.lowercased()) }.map { segment in
            Finding(
                code: code, message: "\"\(segment)\" names nothing; name the module after what it holds",
                location: Location(file.path, 1, 1), subject: segment)
        }
    }
}
