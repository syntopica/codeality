import 'package:codeality_dart/src/init/plan_disposition.dart';
import 'package:codeality_dart/src/init/plan_pubspec.dart';
import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

import '../support/repo_fixture.dart';

void main() {
  late RepoFixture repo;
  setUp(() => repo = RepoFixture());
  tearDown(() => repo.dispose());

  test('adds codeality_lints and drops the lint packages it supersedes', () {
    final planned = planPubspec(repo.flutterApp('app'));
    expect(planned.disposition, PlanDisposition.merge);
    expect(planned.detail, contains('pub get'));
    final dev =
        (loadYaml(planned.content!) as YamlMap)['dev_dependencies'] as YamlMap;
    expect(dev.keys, containsAll(['codeality_lints', 'flutter_test']));
    expect(dev.keys, isNot(contains('flutter_lints')));
  });

  test('an existing codeality_lints pin, even a git ref, is left alone', () {
    final root = repo.dartPackage('core');
    repo.write('core/pubspec.yaml', '''
name: core
dev_dependencies:
  codeality_lints:
    git:
      url: https://github.com/syntopica/codeality
      path: packages/codeality-dart-lints
''');
    expect(planPubspec(root).disposition, PlanDisposition.unchanged);
  });

  test('a pubspec without dev_dependencies gains the section', () {
    final root = repo.dartPackage('core');
    repo.write('core/pubspec.yaml', 'name: core\n');
    final planned = planPubspec(root);
    final dev =
        (loadYaml(planned.content!) as YamlMap)['dev_dependencies'] as YamlMap;
    expect(dev.keys, ['codeality_lints']);
  });

  test('replacing the only dev dependency keeps block style', () {
    final root = repo.dartPackage('core');
    repo.write(
      'core/pubspec.yaml',
      'name: core\ndev_dependencies:\n  lints: ^6.1.0\n',
    );
    expect(
      planPubspec(root).content,
      'name: core\ndev_dependencies:\n  codeality_lints: ^0.1.0\n',
    );
  });
}
