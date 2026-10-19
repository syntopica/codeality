import 'dart:io';

import 'package:path/path.dart' as p;

import 'default_excludes.dart';

/// Project-relative POSIX paths of the `.dart` files under [root], skipping
/// excluded directories and any directory that is its own pubspec project.
Iterable<String> walkRoot(String projectRoot, String root) sync* {
  final directory = Directory(p.join(projectRoot, root));
  final entries = directory.listSync(followLinks: false)
    ..sort((a, b) => a.path.compareTo(b.path));
  for (final entry in entries) {
    final name = p.basename(entry.path);
    if (entry is Directory) {
      if (defaultExcludes.contains(name)) continue;
      if (File(p.join(entry.path, 'pubspec.yaml')).existsSync()) continue;
      yield* walkRoot(projectRoot, p.posix.join(root, name));
    } else if (entry is File && name.endsWith('.dart')) {
      yield p.posix.join(root, name);
    }
  }
}
