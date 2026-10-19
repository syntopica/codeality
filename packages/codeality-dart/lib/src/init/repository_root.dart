import 'dart:io';

import 'package:path/path.dart' as p;

/// The git root above [projectRoot], or [projectRoot] itself outside git.
String repositoryRoot(String projectRoot) {
  final result = Process.runSync('git', [
    'rev-parse',
    '--show-toplevel',
  ], workingDirectory: projectRoot);
  if (result.exitCode != 0) return projectRoot;
  return p.normalize((result.stdout as String).trim());
}
