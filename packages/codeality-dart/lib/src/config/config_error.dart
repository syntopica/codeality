/// A configuration problem. The CLI exits 2 on it.
final class ConfigError implements Exception {
  const ConfigError(this.message);

  final String message;

  @override
  String toString() => 'ConfigError: $message';
}
