/// The two suppression comment forms, matching codeality-py's.
abstract final class SuppressionPatterns {
  static final RegExp inline = RegExp(
    r'//\s*codeality-dart:\s*ignore\[(?<code>[A-Z]{3}\d{3})\]',
  );
  static final RegExp fileWide = RegExp(
    r'//\s*codeality-dart:\s*ignore-file\[(?<code>[A-Z]{3}\d{3})\]'
    r'\s*reason:\s*\S',
  );
}
