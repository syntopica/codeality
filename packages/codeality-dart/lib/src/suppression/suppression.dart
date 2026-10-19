/// A comment silencing one rule, on one line or (when [line] is null) in the
/// whole file.
final class Suppression {
  const Suppression(this.code, this.line);

  final String code;
  final int? line;
}
