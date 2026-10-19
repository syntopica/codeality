/// The word boundaries `snakeCase` splits on.
abstract final class SnakeCasePatterns {
  static final RegExp lowerToUpper = RegExp('([a-z0-9])([A-Z])');
  static final RegExp acronymEnd = RegExp('([A-Z]+)([A-Z][a-z])');
}
