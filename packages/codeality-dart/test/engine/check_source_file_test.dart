import 'package:codeality_dart/src/engine/check_source_file.dart';
import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('an unparsable file reports BDT000 at the first diagnostic', () {
    final findings = checkSourceFile(
      project.file('lib/a.dart', 'class A {\n'),
      project.loaded,
    );
    final parse = findings.where((f) => f.code == RuleCode.bdt000).single;
    expect(parse.location.path, 'lib/a.dart');
    expect(parse.location.line, greaterThanOrEqualTo(1));
  });

  test('a generated file has no findings', () {
    final big = List.generate(400, (i) => 'final v$i = $i;').join('\n');
    expect(
      checkSourceFile(project.file('lib/a.g.dart', big), project.loaded),
      isEmpty,
    );
  });
}
