import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:codeality_dart/src/config/config_error.dart';
import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/model/module_role.dart';
import 'package:codeality_dart/src/roles/assign_module_role.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;

  setUp(() => project = Directory.systemTemp.createTempSync('cd-roles-'));
  tearDown(() => project.deleteSync(recursive: true));

  ModuleRole roleOf(String path, String text) {
    final unit = parseString(content: text, throwIfDiagnostics: false).unit;
    return assignModuleRole(path, unit, text, loadConfig(project.path));
  }

  test('generated beats test', () {
    expect(roleOf('test/foo.mocks.dart', 'class A {}'), ModuleRole.generated);
  });

  test('generated file suffixes match at any depth', () {
    expect(roleOf('lib/data/db.g.dart', 'class A {}'), ModuleRole.generated);
    expect(roleOf('lib/x.freezed.dart', 'class A {}'), ModuleRole.generated);
  });

  test('a generated marker in the first lines makes a file generated', () {
    const text = '// GENERATED CODE - DO NOT MODIFY BY HAND\n\nclass A {}\n';
    expect(roleOf('lib/a.dart', text), ModuleRole.generated);
  });

  test('a marker after the first five lines does not count', () {
    const text = '\n\n\n\n\n\n// GENERATED CODE\nclass A {}\n';
    expect(roleOf('lib/a.dart', text), ModuleRole.ordinary);
  });

  test('test roots and _test suffix are tests', () {
    expect(roleOf('test/helpers/fake.dart', 'class A {}'), ModuleRole.test);
    expect(
      roleOf('integration_test/app.dart', 'void main() {}'),
      ModuleRole.test,
    );
    expect(roleOf('lib/a_test.dart', 'void main() {}'), ModuleRole.test);
  });

  test('a file of only export directives is a barrel', () {
    const text = "library;\nexport 'src/a.dart';\nexport 'src/b.dart';\n";
    expect(roleOf('lib/x.dart', text), ModuleRole.barrel);
  });

  test('lib/main.dart is an entrypoint by default', () {
    expect(roleOf('lib/main.dart', 'void main() {}'), ModuleRole.entrypoint);
    expect(roleOf('bin/tool.dart', 'void main() {}'), ModuleRole.entrypoint);
  });

  test('configured data role applies', () {
    File(p.join(project.path, 'codeality-dart.yaml'))
        .writeAsStringSync('roles:\n  data: [lib/constants/*.dart]\n');
    expect(
      roleOf('lib/constants/colors.dart', 'const a = 1;'),
      ModuleRole.data,
    );
  });

  test('a file matched by two configured roles is a configuration error', () {
    File(p.join(project.path, 'codeality-dart.yaml')).writeAsStringSync(
      'roles:\n  entrypoint: [lib/*.dart]\n  data: [lib/c*.dart]\n',
    );
    expect(
      () => roleOf('lib/colors.dart', 'const a = 1;'),
      throwsA(isA<ConfigError>()),
    );
  });

  test('anything else is ordinary', () {
    expect(roleOf('lib/src/a.dart', 'class A {}'), ModuleRole.ordinary);
  });
}
