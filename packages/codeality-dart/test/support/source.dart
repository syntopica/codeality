import 'dart:io';

import 'package:codeality_dart/src/config/dart_config.dart';
import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/parsing/parse_source_file.dart';
import 'package:codeality_dart/src/parsing/source_file.dart';
import 'package:path/path.dart' as p;

/// A throwaway project directory for rule tests.
final class FixtureProject {
  FixtureProject()
    : root = Directory.systemTemp.createTempSync('cd-fixture-').path;

  final String root;

  void config(String yaml) =>
      File(p.join(root, 'codeality-dart.yaml')).writeAsStringSync(yaml);

  DartConfig get loaded => loadConfig(root);

  SourceFile file(String path, String text) {
    final file = File(p.join(root, path));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
    return parseSourceFile(root, path, loaded);
  }

  void dispose() => Directory(root).deleteSync(recursive: true);
}
