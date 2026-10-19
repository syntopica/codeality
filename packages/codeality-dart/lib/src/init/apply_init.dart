import 'dart:io';

import 'plan_disposition.dart';
import 'planned_file.dart';

/// Write creates and merges, and conflicts when [force]d. Returns what was
/// written.
List<PlannedFile> applyInit(List<PlannedFile> plan, {required bool force}) {
  final written = <PlannedFile>[];
  for (final planned in plan) {
    final content = planned.content;
    final writable =
        planned.disposition == PlanDisposition.create ||
        planned.disposition == PlanDisposition.merge ||
        (force && planned.disposition == PlanDisposition.conflict);
    if (content == null || !writable) continue;
    File(planned.path)
      ..parent.createSync(recursive: true)
      ..writeAsStringSync(content);
    written.add(planned);
  }
  return written;
}
