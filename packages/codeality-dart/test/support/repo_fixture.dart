import 'dart:io';

import 'package:path/path.dart' as p;

/// A throwaway git repository holding Dart projects, for init tests.
final class RepoFixture {
  RepoFixture() : root = Directory.systemTemp.createTempSync('cd-repo-').path {
    Process.runSync('git', ['init', '-q'], workingDirectory: root);
  }

  final String root;

  String path(String relative) => p.join(root, relative);

  void write(String relative, String text) {
    final file = File(path(relative));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
  }

  String read(String relative) => File(path(relative)).readAsStringSync();

  bool exists(String relative) => File(path(relative)).existsSync();

  /// A Flutter app at [relative].
  String flutterApp(String relative) {
    write('$relative/pubspec.yaml', '''
name: app
environment:
  sdk: ^3.9.0
dependencies:
  flutter:
    sdk: flutter
dev_dependencies:
  flutter_lints: ^6.0.0
  flutter_test:
    sdk: flutter
''');
    return path(relative);
  }

  /// A pure Dart package at [relative].
  String dartPackage(String relative) {
    write('$relative/pubspec.yaml', '''
name: core
environment:
  sdk: ^3.9.0
dev_dependencies:
  lints: ^6.1.0
  test: ^1.33.0
''');
    return path(relative);
  }

  void dispose() => Directory(root).deleteSync(recursive: true);
}
