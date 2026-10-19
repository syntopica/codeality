import SwiftSyntax

/// Lines holding at least one token. Comments are trivia, so blank and
/// comment-only lines drop out; a multi-line string counts every line.
func countCodeLines(_ file: SourceFile) -> Int {
    var lines = Set<Int>()
    for token in file.tree.tokens(viewMode: .sourceAccurate) where token.tokenKind != .endOfFile {
        let first = file.converter.location(for: token.positionAfterSkippingLeadingTrivia).line
        let last = file.converter.location(for: token.endPositionBeforeTrailingTrivia).line
        lines.formUnion(first...max(first, last))
    }
    return lines.count
}
