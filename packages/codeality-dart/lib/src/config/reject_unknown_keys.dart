import 'config_error.dart';
import 'config_schema.dart';

/// Throw when [document] holds a key the schema does not know, so a typo
/// fails loudly instead of silently keeping a default.
void rejectUnknownKeys(Map<Object?, Object?> document, [String prefix = '']) {
  for (final MapEntry(:key, :value) in document.entries) {
    final path = '$prefix$key';
    if (!configSchema.contains(path)) {
      throw ConfigError('unknown key "$path" in codeality-dart.yaml');
    }
    if (value is Map) {
      rejectUnknownKeys(value.cast<Object?, Object?>(), '$path.');
    }
  }
}
