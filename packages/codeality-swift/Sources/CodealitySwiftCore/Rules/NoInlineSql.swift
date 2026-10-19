/// BSW005: SQL lives in resource files, not in string literals.
struct NoInlineSql: Rule {
    let code = RuleCode.bsw005

    func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] {
        let visitor = OutermostStringLiterals()
        visitor.walk(file.tree)
        return visitor.found.filter { looksLikeSql(stringLiteralText($0)) }.map { literal in
            let location = file.converter.location(for: literal.positionAfterSkippingLeadingTrivia)
            return Finding(
                code: code,
                message: "inline SQL; move this query into a .sql resource and load it from there",
                location: Location(file.path, location.line, location.column))
        }
    }
}
