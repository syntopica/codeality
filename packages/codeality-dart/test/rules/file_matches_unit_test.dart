import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/file_matches_unit.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('the file is named after its unit', () {
    final rule = FileMatchesUnit();
    expect(
      rule.check(
        project.file('lib/foo_bar.dart', 'class FooBar {}'),
        project.loaded,
      ),
      isEmpty,
    );
    final finding = rule
        .check(project.file('lib/foo_bar.dart', 'class Baz {}'), project.loaded)
        .single;
    expect(finding.code, RuleCode.bdt002);
    expect(finding.subject, 'Baz');
    expect(finding.message, contains('baz.dart'));
  });

  test('a widget and its State match the widget', () {
    const text =
        'class Counter extends StatefulWidget {}\nclass _CounterState extends State<Counter> {}\n';
    expect(
      FileMatchesUnit().check(
        project.file('lib/counter.dart', text),
        project.loaded,
      ),
      isEmpty,
    );
  });

  test('a private unit matches without its underscore', () {
    expect(
      FileMatchesUnit().check(
        project.file('lib/hidden.dart', 'class _Hidden {}'),
        project.loaded,
      ),
      isEmpty,
    );
  });

  test('entrypoints, data and multi-unit files are not judged', () {
    final rule = FileMatchesUnit();
    expect(
      rule.check(
        project.file('lib/main.dart', 'void main() {}'),
        project.loaded,
      ),
      isEmpty,
    );
    expect(
      rule.check(
        project.file('lib/x.dart', 'class A {}\nclass B {}'),
        project.loaded,
      ),
      isEmpty,
    );
  });
}
