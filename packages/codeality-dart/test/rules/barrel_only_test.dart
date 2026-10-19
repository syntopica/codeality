import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/barrel_only.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('exports mixed with declarations are a finding', () {
    final findings = BarrelOnly().check(
      project.file('lib/a.dart', "export 'b.dart';\nclass A {}\n"),
      project.loaded,
    );
    expect(findings.single.code, RuleCode.bdt005);
  });

  test('a directives-only barrel passes', () {
    expect(
      BarrelOnly().check(
        project.file(
          'lib/a.dart',
          "library;\nimport 'c.dart';\nexport 'b.dart';\n",
        ),
        project.loaded,
      ),
      isEmpty,
    );
  });

  test('a file without exports is not judged', () {
    expect(
      BarrelOnly().check(
        project.file('lib/a.dart', 'class A {}'),
        project.loaded,
      ),
      isEmpty,
    );
  });
}
