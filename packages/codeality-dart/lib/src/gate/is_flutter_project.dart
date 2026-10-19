import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:yaml/yaml.dart';

/// Whether the project's pubspec depends on the Flutter SDK.
bool isFlutterProject(String projectRoot) {
  final pubspec = File(p.join(projectRoot, 'pubspec.yaml'));
  if (!pubspec.existsSync()) return false;
  final document = loadYaml(pubspec.readAsStringSync());
  if (document is! Map) return false;
  final flutter = (document['dependencies'] as Map?)?['flutter'];
  return flutter is Map && flutter['sdk'] == 'flutter';
}
