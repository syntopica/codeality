import 'package:codeality_dart/src/gate/parse_machine_output.dart';
import 'package:test/test.dart';

void main() {
  test('parses records into project-relative diagnostics', () {
    const stdout = '''
INFO|LINT|AVOID_PRINT|/work/app/lib/a.dart|3|3|5|Don't invoke 'print' in production code.
ERROR|COMPILE_TIME_ERROR|UNDEFINED_IDENTIFIER|/work/app/lib/b.dart|10|1|3|Undefined name 'a\\|b'.
Analyzing app...
''';
    final found = parseMachineOutput(stdout, '/work/app');
    expect(found, hasLength(2));
    expect(found.first.code, 'avoid_print');
    expect(found.first.message, startsWith('info: '));
    expect(found.first.location.path, 'lib/a.dart');
    expect(found.first.location.line, 3);
    expect(found.first.location.column, 3);
    expect(found.last.message, "error: Undefined name 'a|b'.");
  });

  test('lines that are not records are ignored', () {
    expect(parseMachineOutput('No issues found!\n', '/work/app'), isEmpty);
  });
}
