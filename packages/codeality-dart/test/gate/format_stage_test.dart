@Tags(['integration'])
library;

import 'dart:io';

import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/gate/format_stage.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;
  setUp(() {
    project = Directory.systemTemp.createTempSync('cd-format-');
    File(p.join(project.path, 'pubspec.yaml')).writeAsStringSync('name: f\n');
    Directory(p.join(project.path, 'lib')).createSync();
  });
  tearDown(() => project.deleteSync(recursive: true));

  test('unformatted code is a finding naming the file', () async {
    File(p.join(project.path, 'lib/a.dart')).writeAsStringSync('class   A{}');
    final result = await formatStage(project.path, loadConfig(project.path));
    expect(result.status, StageStatus.findings);
    expect(result.findings.single.location.path, 'lib/a.dart');
  });

  test('formatted code passes', () async {
    File(p.join(project.path, 'lib/a.dart')).writeAsStringSync('class A {}\n');
    final result = await formatStage(project.path, loadConfig(project.path));
    expect(result.status, StageStatus.passed);
  });

  test('a missing dart binary fails to run', () async {
    final result = await formatStage(
      project.path,
      loadConfig(project.path),
      environment: const {'PATH': ''},
    );
    expect(result.status, StageStatus.failedToRun);
  });
}
