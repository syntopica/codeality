import 'config_error.dart';

/// Throw when one glob is listed under two roles: first-match-wins would
/// make the role depend on key order.
void rejectDuplicateRoleClaims(Map<String, List<String>> roles) {
  final owners = <String, String>{};
  for (final MapEntry(key: role, value: globs) in roles.entries) {
    for (final glob in globs) {
      final previous = owners[glob];
      if (previous != null) {
        throw ConfigError(
          '"$glob" is claimed by both roles $previous and $role',
        );
      }
      owners[glob] = role;
    }
  }
}
