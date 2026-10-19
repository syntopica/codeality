import '../model/finding.dart';

/// `path:line:col: BDT001 one-primary-unit: message`.
String renderFindingLine(Finding finding) =>
    '${finding.location.path}:${finding.location.line}:'
    '${finding.location.column}: ${finding.code.code} ${finding.code.slug}: '
    '${finding.message}';
