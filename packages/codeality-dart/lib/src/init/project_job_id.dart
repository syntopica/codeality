import 'package:path/path.dart' as p;

/// The CI job id for a project: `dart-` plus its repository-relative path
/// with `/` and `_` turned into `-`.
String projectJobId(String repoRoot, String projectRoot) {
  final relative = p.relative(projectRoot, from: repoRoot);
  if (relative == '.') return 'dart';
  return 'dart-${relative.replaceAll(RegExp('[/_]'), '-')}';
}
