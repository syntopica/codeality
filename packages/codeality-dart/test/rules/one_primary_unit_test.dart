import 'package:codeality_dart/src/rules/one_primary_unit.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  List<String> messages(String path, String text) => [
    for (final finding in OnePrimaryUnit().check(
      project.file(path, text),
      project.loaded,
    ))
      '${finding.code.code}: ${finding.message}',
  ];

  test('two public classes is a finding naming both', () {
    final found = messages('lib/a.dart', 'class A {}\nclass B {}\n');
    expect(found.single, startsWith('BDT001'));
    expect(found.single, allOf(contains('A'), contains('B')));
  });

  test('a StatefulWidget with its State is one unit', () {
    const text = '''
class Counter extends StatefulWidget {
  @override
  State<Counter> createState() => _CounterState();
}
class _CounterState extends State<Counter> {}
''';
    expect(messages('lib/counter.dart', text), isEmpty);
  });

  test('a State of another widget is a second unit', () {
    const text = '''
class Counter extends StatefulWidget {}
class _OtherState extends State<Other> {}
''';
    expect(messages('lib/counter.dart', text), hasLength(1));
  });

  test('a private helper next to a public class is a finding', () {
    expect(
      messages('lib/a.dart', 'class A {}\nclass _Helper {}\n'),
      hasLength(1),
    );
  });

  test('an extension on the primary counts with it', () {
    expect(messages('lib/a.dart', 'class A {}\nextension on A {}\n'), isEmpty);
    expect(
      messages('lib/a.dart', 'class A {}\nextension AX on A {}\n'),
      isEmpty,
    );
  });

  test('each top-level variable is its own unit', () {
    expect(messages('lib/a.dart', 'final a = 1, b = 2;\n'), hasLength(1));
  });

  test('top-level functions, typedefs, enums and mixins count', () {
    expect(
      messages('lib/a.dart', 'void f() {}\ntypedef T = int;\n'),
      hasLength(1),
    );
    expect(messages('lib/a.dart', 'enum E { a }\nmixin M {}\n'), hasLength(1));
  });

  test('tests and barrels are exempt', () {
    expect(messages('test/a_test.dart', 'class A {}\nclass B {}\n'), isEmpty);
  });

  test('a data file may hold only variables', () {
    project.config('roles:\n  data: [lib/consts.dart]\n');
    expect(
      messages('lib/consts.dart', 'const a = 1;\nconst b = 2;\n'),
      isEmpty,
    );
    expect(
      messages('lib/consts.dart', 'const a = 1;\nvoid f() {}\n'),
      hasLength(1),
    );
  });

  test('an entrypoint holds only main', () {
    expect(messages('lib/main.dart', 'void main() {}\n'), isEmpty);
    expect(
      messages('lib/main.dart', 'void main() {}\nclass App {}\n'),
      hasLength(1),
    );
  });

  test('a file with only imports has nothing to count', () {
    expect(messages('lib/a.dart', "import 'b.dart';\n"), isEmpty);
  });
}
