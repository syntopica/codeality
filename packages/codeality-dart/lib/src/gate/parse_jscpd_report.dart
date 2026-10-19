import 'dart:convert';

import '../model/gate_finding.dart';
import '../model/location.dart';
import 'clone_fingerprint.dart';
import 'jscpd_report.dart';

/// Read jscpd's JSON report. jscpd's own `isNew` is ignored: new versus known
/// comes only from the codeality baseline.
JscpdReport parseJscpdReport(String json) {
  final document = jsonDecode(json);
  if (document is! Map<String, Object?>) {
    throw const FormatException('jscpd report is not an object');
  }
  final duplicates = (document['duplicates'] as List?) ?? const [];
  final clones = [
    for (final duplicate in duplicates.cast<Map<String, Object?>>())
      for (final first in [duplicate['firstFile']! as Map<String, Object?>])
        for (final second in [duplicate['secondFile']! as Map<String, Object?>])
          GateFinding(
            code: 'duplicate',
            message:
                '${duplicate['lines']} lines duplicated with '
                '${second['name']}:${(second['startLoc']! as Map)['line']}',
            location: Location(
              first['name']! as String,
              (first['startLoc']! as Map)['line'] as int,
              (first['startLoc']! as Map)['column'] as int? ?? 1,
            ),
            fingerprint: cloneFingerprint(
              first['name']! as String,
              second['name']! as String,
              duplicate['fragment'] as String? ?? '',
            ),
          ),
  ];
  final statistics = document['statistics'] as Map<String, Object?>?;
  final total = statistics?['total'] as Map<String, Object?>?;
  return JscpdReport(
    clones: clones,
    percentage: total?['percentage'] as num? ?? 0,
  );
}
