/// The regular expressions behind `looksLikeSql`, ported from codeality-py.
/// Computed: a `Regex` is not `Sendable`, so none can be a stored global.
enum SqlPatterns {
  static var select: Regex<AnyRegexOutput> {
    try! Regex(#"\bselect\b(?<columns>.+?)\bfrom\b\s+(?<source>[\w."`\[]+)"#)
  }

  static var otherShapes: [Regex<AnyRegexOutput>] {
    [
      #"\binsert\s+into\b\s+[\w."`\[]+"#,
      #"\bupdate\b\s+[\w."`\[]+\s+set\b"#,
      #"\bdelete\s+from\b\s+[\w."`\[]+"#,
      #"\b(create|alter|drop)\s+(table|index|view|trigger)\b"#,
    ].map { try! Regex($0) }
  }

  static var clauses: Regex<AnyRegexOutput> {
    try! Regex(#"\b(where|join|group\s+by|order\s+by|having|limit|union|returning)\b"#)
  }
}
