/// The two suppression comment forms, matching codeality-py's.
enum SuppressionPatterns {
  static var inline: Regex<(Substring, code: Substring)> {
    #/\/\/\s*codeality-swift:\s*ignore\[(?<code>[A-Z]{3}\d{3})\]/#
  }

  static var fileWide: Regex<(Substring, code: Substring)> {
    #/\/\/\s*codeality-swift:\s*ignore-file\[(?<code>[A-Z]{3}\d{3})\]\s*reason:\s*\S/#
  }
}
