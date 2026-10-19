import '../baseline/fingerprint.dart';

/// A clone's identity: both paths, sorted, and the duplicated fragment with
/// whitespace collapsed.
String cloneFingerprint(String pathA, String pathB, String fragment) {
  final paths = [pathA, pathB]..sort();
  return fingerprint(
    'duplicates',
    'duplicate',
    paths.join('|'),
    fragment.replaceAll(RegExp(r'\s+'), ' ').trim(),
  );
}
