import 'dart:io';

/// The project-relative paths git does not ignore, or null when
/// [projectRoot] is not inside a git work tree.
Set<String>? gitVisibleFiles(String projectRoot) {
  final result = Process.runSync('git', [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ], workingDirectory: projectRoot);
  if (result.exitCode != 0) return null;
  return (result.stdout as String)
      .split('\u0000')
      .where((path) => path.isNotEmpty)
      .toSet();
}
