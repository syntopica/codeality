import 'package:glob/glob.dart';
import 'package:path/path.dart' as p;

/// Whether the project-relative [path] matches any of [globs].
bool matchesAnyGlob(String path, Iterable<String> globs) =>
    globs.any((glob) => Glob(glob, context: p.posix).matches(path));
