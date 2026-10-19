/// A clone's identity: both paths, sorted, and the duplicated fragment with
/// whitespace collapsed. The same material as codeality-dart's.
public func cloneFingerprint(_ pathA: String, _ pathB: String, _ fragment: String) -> String {
  fingerprint(
    section: "duplicates", code: "duplicate", path: [pathA, pathB].sorted().joined(separator: "|"),
    context: fragment.split(whereSeparator: \.isWhitespace).joined(separator: " "))
}
