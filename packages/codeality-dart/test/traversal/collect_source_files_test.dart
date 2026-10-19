import 'dart:io';

import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/traversal/collect_source_files.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;

  void write(String relative, [String text = 'void f() {}\n']) {
    final file = File(p.join(project.path, relative));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
  }

  setUp(() {
    project = Directory.systemTemp.createTempSync('cd-traversal-');
    write('pubspec.yaml', 'name: fixture\n');
  });
  tearDown(() => project.deleteSync(recursive: true));

  test('collects sorted project-relative dart files from the roots', () {
    write('lib/b.dart');
    write('lib/src/a.dart');
    write('test/a_test.dart');
    write('lib/readme.md', '# not dart');
    final warnings = <String>[];
    final files = collectSourceFiles(
      project.path,
      loadConfig(project.path),
      warn: warnings.add,
    );
    expect(files, ['lib/b.dart', 'lib/src/a.dart', 'test/a_test.dart']);
  });

  test('does not walk into a nested pubspec project', () {
    write('lib/a.dart');
    write('lib/nested/pubspec.yaml', 'name: nested\n');
    write('lib/nested/lib/b.dart');
    final files = collectSourceFiles(
      project.path,
      loadConfig(project.path),
      warn: (_) {},
    );
    expect(files, ['lib/a.dart']);
  });

  test('skips gitignored files inside a git repository', () {
    write('lib/a.dart');
    write('lib/secret.dart');
    write('.gitignore', 'lib/secret.dart\n');
    Process.runSync('git', ['init', '-q'], workingDirectory: project.path);
    final files = collectSourceFiles(
      project.path,
      loadConfig(project.path),
      warn: (_) {},
    );
    expect(files, ['lib/a.dart']);
  });

  test('skips default excluded directories', () {
    write('lib/a.dart');
    write('lib/.dart_tool/x.dart');
    write('lib/build/y.dart');
    final files = collectSourceFiles(
      project.path,
      loadConfig(project.path),
      warn: (_) {},
    );
    expect(files, ['lib/a.dart']);
  });

  test('a missing root warns once and does not throw', () {
    write('lib/a.dart');
    final warnings = <String>[];
    final files = collectSourceFiles(
      project.path,
      loadConfig(project.path),
      warn: warnings.add,
    );
    expect(files, ['lib/a.dart']);
    expect(warnings, contains('source root bin does not exist'));
    expect(warnings, contains('test root test does not exist'));
  });
}
