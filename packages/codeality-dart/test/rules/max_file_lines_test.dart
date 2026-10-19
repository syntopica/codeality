import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/count_code_lines.dart';
import 'package:codeality_dart/src/rules/max_file_lines.dart';
import 'package:test/test.dart';

import '../support/source.dart';

String _lines(int count) =>
    List.generate(count, (i) => 'final v$i = $i;').join('\n');

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('151 occupied lines in lib is a finding, 150 is not', () {
    final rule = MaxFileLines();
    expect(
      rule.check(project.file('lib/a.dart', _lines(150)), project.loaded),
      isEmpty,
    );
    final findings = rule.check(
      project.file('lib/b.dart', _lines(151)),
      project.loaded,
    );
    expect(findings.single.code, RuleCode.bdt004);
    expect(findings.single.message, contains('151'));
    expect(findings.single.message, contains('150'));
  });

  test('tests get the test cap', () {
    final rule = MaxFileLines();
    expect(
      rule.check(project.file('test/a_test.dart', _lines(300)), project.loaded),
      isEmpty,
    );
    expect(
      rule.check(project.file('test/b_test.dart', _lines(301)), project.loaded),
      hasLength(1),
    );
  });

  test('comments, blank lines, BOM and CRLF are not counted', () {
    const text = '﻿// a\r\n/// b\r\n\r\n/* c\r\n d */\r\n';
    expect(countCodeLines(project.file('lib/c.dart', text)), 0);
  });

  test('every line of a multi-line string counts', () {
    const text = "final s = '''\none\ntwo\n''';\n";
    expect(countCodeLines(project.file('lib/s.dart', text)), 4);
  });

  test('a code line with a trailing comment counts once', () {
    expect(
      countCodeLines(project.file('lib/t.dart', 'final a = 1; // x\n')),
      1,
    );
  });
}
