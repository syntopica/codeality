import 'dart:io';

import 'package:codeality_dart/src/config/config_error.dart';
import 'package:codeality_dart/src/config/load_config.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;

  setUp(() => project = Directory.systemTemp.createTempSync('cd-config-'));
  tearDown(() => project.deleteSync(recursive: true));

  void writeConfig(String text) =>
      File(p.join(project.path, 'codeality-dart.yaml')).writeAsStringSync(text);

  test('a missing file yields the defaults', () {
    final config = loadConfig(project.path);
    expect(config.schemaVersion, 1);
    expect(config.sourceRoots, ['lib', 'bin']);
    expect(config.testRoots, ['test', 'integration_test']);
    expect(config.respectGitignore, isTrue);
    expect(config.coverageThreshold, 80);
    expect(config.testBudgetSeconds, 300);
    expect(config.maxFileLines, 150);
    expect(config.testMaxFileLines, 300);
    expect(config.roles['entrypoint'], ['lib/main.dart', 'bin/*.dart']);
    expect(config.roles['data'], isEmpty);
    expect(config.roles['generated'], isEmpty);
    expect(config.sqlGlobs, ['**/*.drift', '**/*.sql']);
    expect(config.duplicatesMinTokens, isNull);
    expect(config.duplicatesThreshold, isNull);
  });

  test('values in the file replace the defaults', () {
    writeConfig('''
schema-version: 1
coverage-threshold: 63
limits:
  max-file-lines: 200
roles:
  data: [lib/constants.dart]
duplicates:
  min-tokens: 50
  threshold: 2
''');
    final config = loadConfig(project.path);
    expect(config.coverageThreshold, 63);
    expect(config.maxFileLines, 200);
    expect(config.testMaxFileLines, 300);
    expect(config.roles['data'], ['lib/constants.dart']);
    expect(config.roles['entrypoint'], ['lib/main.dart', 'bin/*.dart']);
    expect(config.duplicatesMinTokens, 50);
    expect(config.duplicatesThreshold, 2);
  });

  test('an unknown key is a configuration error naming it', () {
    writeConfig('limits:\n  max-lines: 10\n');
    expect(
      () => loadConfig(project.path),
      throwsA(
        isA<ConfigError>().having(
          (e) => e.message,
          'message',
          contains('limits.max-lines'),
        ),
      ),
    );
  });

  test('one glob claimed by two roles is a configuration error', () {
    writeConfig('roles:\n  entrypoint: [lib/x.dart]\n  data: [lib/x.dart]\n');
    expect(
      () => loadConfig(project.path),
      throwsA(
        isA<ConfigError>().having(
          (e) => e.message,
          'message',
          allOf(
            contains('lib/x.dart'),
            contains('entrypoint'),
            contains('data'),
          ),
        ),
      ),
    );
  });

  test('an unsupported schema version names both versions', () {
    writeConfig('schema-version: 2\n');
    expect(
      () => loadConfig(project.path),
      throwsA(
        isA<ConfigError>().having(
          (e) => e.message,
          'message',
          allOf(contains('1'), contains('2')),
        ),
      ),
    );
  });

  test('a value of the wrong type is a configuration error', () {
    writeConfig('coverage-threshold: high\n');
    expect(() => loadConfig(project.path), throwsA(isA<ConfigError>()));
  });
}
