import 'package:codeality_dart/src/gate/read_lcov_line_coverage.dart';
import 'package:test/test.dart';

void main() {
  test('sums hit and found lines across files', () {
    const lcov =
        'SF:a.dart\nLF:10\nLH:7\nend_of_record\nSF:b.dart\nLF:10\nLH:10\nend_of_record\n';
    expect(readLcovLineCoverage(lcov), 85.0);
  });

  test('a report with no lines reads as zero', () {
    expect(readLcovLineCoverage(''), 0.0);
  });
}
