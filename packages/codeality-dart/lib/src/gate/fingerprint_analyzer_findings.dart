import 'dart:io';

import 'package:path/path.dart' as p;

import '../baseline/fingerprint.dart';
import '../baseline/line_context.dart';
import '../model/gate_finding.dart';

/// Give each analyzer diagnostic its fingerprint: path, code and the trimmed
/// offending line, never the line number.
List<GateFinding> fingerprintAnalyzerFindings(
  List<GateFinding> findings,
  String projectRoot,
) {
  final texts = <String, String>{};
  String textOf(String path) => texts.putIfAbsent(path, () {
    final file = File(p.join(projectRoot, path));
    return file.existsSync() ? file.readAsStringSync() : '';
  });
  return [
    for (final finding in findings)
      finding.withBaseline(
        fingerprint(
          'analyzer',
          finding.code,
          finding.location.path,
          lineContext(textOf(finding.location.path), finding.location.line),
        ),
        'new',
      ),
  ];
}
