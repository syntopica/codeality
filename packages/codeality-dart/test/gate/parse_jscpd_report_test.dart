import 'package:codeality_dart/src/gate/clone_fingerprint.dart';
import 'package:codeality_dart/src/gate/parse_jscpd_report.dart';
import 'package:test/test.dart';

const _report = '''
{
  "duplicates": [
    {
      "format": "dart",
      "lines": 12,
      "tokens": 90,
      "fragment": "final a = 1;\\n  final b = 2;",
      "isNew": false,
      "firstFile": {"name": "lib/b.dart", "start": 3, "end": 14,
        "startLoc": {"line": 3, "column": 1}, "endLoc": {"line": 14, "column": 2}},
      "secondFile": {"name": "lib/a.dart", "start": 7, "end": 18,
        "startLoc": {"line": 7, "column": 1}, "endLoc": {"line": 18, "column": 2}}
    }
  ],
  "statistics": {"total": {"percentage": 2.5, "clones": 1, "lines": 480}}
}
''';

void main() {
  test('parses clones and the duplicated percentage', () {
    final report = parseJscpdReport(_report);
    expect(report.percentage, 2.5);
    final clone = report.clones.single;
    expect(clone.code, 'duplicate');
    expect(clone.location.path, 'lib/b.dart');
    expect(clone.location.line, 3);
    expect(clone.message, contains('lib/a.dart:7'));
    expect(clone.message, contains('12 lines'));
    expect(clone.fingerprint, hasLength(16));
  });

  test('swapped file order and whitespace do not change the fingerprint', () {
    expect(
      cloneFingerprint('lib/a.dart', 'lib/b.dart', 'final a = 1;\n  final b;'),
      cloneFingerprint('lib/b.dart', 'lib/a.dart', 'final a = 1; final b;'),
    );
  });

  test('a malformed report is a format exception', () {
    expect(() => parseJscpdReport('not json'), throwsFormatException);
  });
}
