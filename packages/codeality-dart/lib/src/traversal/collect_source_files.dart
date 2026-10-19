import 'dart:io';

import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import 'git_visible_files.dart';
import 'walk_root.dart';

/// Every `.dart` file the rules look at, sorted and project-relative. A root
/// that does not exist is reported through [warn], not thrown.
List<String> collectSourceFiles(
  String projectRoot,
  DartConfig config, {
  required void Function(String) warn,
}) {
  final visible = config.respectGitignore ? gitVisibleFiles(projectRoot) : null;
  final files = <String>{};
  void collect(String kind, List<String> roots) {
    for (final root in roots) {
      if (!Directory(p.join(projectRoot, root)).existsSync()) {
        warn('$kind root $root does not exist');
        continue;
      }
      files.addAll(
        walkRoot(
          projectRoot,
          root,
        ).where((path) => visible == null || visible.contains(path)),
      );
    }
  }

  collect('source', config.sourceRoots);
  collect('test', config.testRoots);
  return files.toList()..sort();
}
