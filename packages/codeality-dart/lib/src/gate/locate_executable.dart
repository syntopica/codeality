import 'dart:io';

import 'package:path/path.dart' as p;

/// The resolved path of [name] on `PATH`, symlinks followed, or null.
String? locateExecutable(String name) {
  final separator = Platform.isWindows ? ';' : ':';
  for (final directory in (Platform.environment['PATH'] ?? '').split(
    separator,
  )) {
    final candidate = File(p.join(directory, name));
    if (candidate.existsSync()) return candidate.resolveSymbolicLinksSync();
  }
  return null;
}
