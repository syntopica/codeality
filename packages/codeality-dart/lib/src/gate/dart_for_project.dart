import 'package:path/path.dart' as p;

import 'is_flutter_project.dart';
import 'locate_executable.dart';

/// The `dart` and pub driver for the project: the Flutter SDK's own for a
/// Flutter project, because `flutter analyze` has no machine output.
({String dart, String pub})? dartForProject(String projectRoot) {
  if (!isFlutterProject(projectRoot)) return (dart: 'dart', pub: 'dart');
  final flutter = locateExecutable('flutter');
  if (flutter == null) return null;
  return (dart: p.join(p.dirname(flutter), 'dart'), pub: flutter);
}
