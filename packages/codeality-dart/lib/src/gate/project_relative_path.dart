import 'package:path/path.dart' as p;

import 'resolved_path.dart';

/// [path] relative to [projectRoot], symlinks resolved on both sides (macOS
/// temp and home directories are symlinks); unchanged when relative already
/// or outside the project.
String projectRelativePath(String path, String projectRoot) {
  if (!p.isAbsolute(path)) return path;
  final root = resolvedPath(projectRoot);
  final resolved = resolvedPath(path);
  return p.isWithin(root, resolved) ? p.relative(resolved, from: root) : path;
}
