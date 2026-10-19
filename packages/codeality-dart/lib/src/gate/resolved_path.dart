import 'dart:io';

import 'package:path/path.dart' as p;

/// [path] with symlinks resolved, or normalised when it does not exist.
String resolvedPath(String path) {
  try {
    return File(path).resolveSymbolicLinksSync();
  } on FileSystemException {
    return p.normalize(path);
  }
}
