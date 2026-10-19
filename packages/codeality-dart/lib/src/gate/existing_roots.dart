import 'dart:io';

import 'package:path/path.dart' as p;

import '../config/dart_config.dart';

/// The configured source and test roots that exist on disk.
List<String> existingRoots(String projectRoot, DartConfig config) => [
  for (final root in [...config.sourceRoots, ...config.testRoots])
    if (Directory(p.join(projectRoot, root)).existsSync()) root,
];
