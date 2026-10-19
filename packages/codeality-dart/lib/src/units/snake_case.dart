import 'snake_case_patterns.dart';

/// The file stem for an identifier: `HTTPClient` -> `http_client`. Leading
/// underscores are dropped.
String snakeCase(String identifier) => identifier
    .replaceFirst(RegExp('^_+'), '')
    .replaceAllMapped(SnakeCasePatterns.acronymEnd, (m) => '${m[1]}_${m[2]}')
    .replaceAllMapped(SnakeCasePatterns.lowerToUpper, (m) => '${m[1]}_${m[2]}')
    .toLowerCase();
