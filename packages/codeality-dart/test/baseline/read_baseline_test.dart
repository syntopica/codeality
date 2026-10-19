import 'dart:io';

import 'package:codeality_dart/src/baseline/baseline_file.dart';
import 'package:codeality_dart/src/baseline/read_baseline.dart';
import 'package:codeality_dart/src/baseline/write_baseline.dart';
import 'package:codeality_dart/src/config/config_error.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;
  setUp(() => project = Directory.systemTemp.createTempSync('cd-baseline-'));
  tearDown(() => project.deleteSync(recursive: true));

  test('a missing baseline reads as null', () {
    expect(readBaseline(project.path), isNull);
  });

  test('round-trips sections and counts', () {
    writeBaseline(
      project.path,
      const BaselineFile(
        sections: {
          'structure': {'f1': 2},
          'analyzer': {},
          'duplicates': {'c1': 1},
        },
      ),
    );
    final read = readBaseline(project.path)!;
    expect(read.sections['structure'], {'f1': 2});
    expect(read.sections['duplicates'], {'c1': 1});
    expect(read.section('analyzer'), isEmpty);
  });

  test('a newer schema version is refused naming both versions', () {
    File(p.join(project.path, '.codeality-dart-baseline.json'))
        .writeAsStringSync('{"schema_version": 2, "sections": {}}');
    expect(
      () => readBaseline(project.path),
      throwsA(
        isA<ConfigError>().having(
          (e) => e.message,
          'message',
          allOf(contains('2'), contains('1')),
        ),
      ),
    );
  });
}
