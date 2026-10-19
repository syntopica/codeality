import 'package:codeality_dart/src/engine/check_source_file.dart';
import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  List<RuleCode> codes(String path, String text) => [
    for (final finding in checkSourceFile(
      project.file(path, text),
      project.loaded,
    ))
      finding.code,
  ];

  test('an inline suppression covers its own line only', () {
    const text = '''
const a = 'DELETE FROM users'; // codeality-dart: ignore[BDT006]
const b = 'DELETE FROM songs';
''';
    final found = checkSourceFile(
      project.file('lib/q.dart', text),
      project.loaded,
    ).where((f) => f.code == RuleCode.bdt006).toList();
    expect(found.single.location.line, 2);
  });

  test('a file-wide suppression needs a reason', () {
    const withReason =
        '// codeality-dart: ignore-file[BDT006] reason: SQL samples under test\n'
        "const a = 'DELETE FROM users';\n";
    expect(codes('lib/x.dart', withReason), isNot(contains(RuleCode.bdt006)));
    const withoutReason =
        '// codeality-dart: ignore-file[BDT006]\n'
        "const a = 'DELETE FROM users';\n";
    expect(codes('lib/x.dart', withoutReason), contains(RuleCode.bdt006));
  });

  test('a parse error is never suppressible', () {
    const text =
        '// codeality-dart: ignore-file[BDT000] reason: no\nclass A {\n';
    expect(codes('lib/a.dart', text), contains(RuleCode.bdt000));
  });
}
