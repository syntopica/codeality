import 'config_error.dart';

/// Typed reads from a parsed YAML document, by dotted path.
final class ConfigReader {
  const ConfigReader(this._document);

  final Map<Object?, Object?> _document;

  Object? _lookup(String path) {
    Object? node = _document;
    for (final segment in path.split('.')) {
      if (node is! Map) return null;
      node = node[segment];
    }
    return node;
  }

  T _typed<T>(String path, T fallback) {
    final value = _lookup(path);
    if (value == null) return fallback;
    if (value is T) return value as T;
    throw ConfigError('"$path" must be a ${T.toString()}, got "$value"');
  }

  int integer(String path, int fallback) => _typed<int>(path, fallback);

  int? optionalInteger(String path) => _typed<int?>(path, null);

  num? optionalNumber(String path) => _typed<num?>(path, null);

  bool boolean(String path, bool fallback) => _typed<bool>(path, fallback);

  List<String> strings(String path, List<String> fallback) {
    final value = _lookup(path);
    if (value == null) return fallback;
    if (value is! List || value.any((item) => item is! String)) {
      throw ConfigError('"$path" must be a list of strings');
    }
    return value.cast<String>();
  }
}
