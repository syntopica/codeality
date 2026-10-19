import '../config/config_error.dart';
import '../config/dart_config.dart';
import '../model/module_role.dart';
import 'matches_any_glob.dart';

/// The `entrypoint` or `data` role configured for [path], or null. Two
/// matching roles is a configuration error, never first-match-wins.
ModuleRole? configuredRole(String path, DartConfig config) {
  final matches = [
    for (final role in [ModuleRole.entrypoint, ModuleRole.data])
      if (matchesAnyGlob(path, config.roles[role.name] ?? const [])) role,
  ];
  if (matches.length > 1) {
    throw ConfigError(
      '$path is claimed by both roles ${matches.map((r) => r.name).join(' and ')}',
    );
  }
  return matches.isEmpty ? null : matches.single;
}
