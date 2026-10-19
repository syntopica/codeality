final RegExp _lowerToUpper = RegExp('([a-z0-9])([A-Z])');
final RegExp _acronymEnd = RegExp('([A-Z]+)([A-Z][a-z])');

/// The file stem for an identifier: `HTTPClient` -> `http_client`. Leading
/// underscores are dropped.
String snakeCase(String identifier) => identifier
    .replaceFirst(RegExp('^_+'), '')
    .replaceAllMapped(_acronymEnd, (m) => '${m[1]}_${m[2]}')
    .replaceAllMapped(_lowerToUpper, (m) => '${m[1]}_${m[2]}')
    .toLowerCase();
