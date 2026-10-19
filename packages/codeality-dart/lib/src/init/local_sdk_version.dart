import 'dart:convert';
import 'dart:io';

import '../gate/is_flutter_project.dart';

/// The installed Flutter version for a Flutter project, else the Dart SDK
/// version, so CI pins what the project was set up with.
String localSdkVersion(String projectRoot) {
  if (isFlutterProject(projectRoot)) {
    final result = Process.runSync('flutter', ['--version', '--machine']);
    if (result.exitCode == 0) {
      final document =
          jsonDecode(result.stdout as String) as Map<String, Object?>;
      return document['frameworkVersion']! as String;
    }
  }
  return Platform.version.split(' ').first;
}
