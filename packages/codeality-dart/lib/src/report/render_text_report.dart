import '../engine/check_result.dart';
import 'render_finding_line.dart';

/// One line per finding, the warnings, then a summary of what was scanned.
String renderTextReport(CheckResult result) => [
  ...result.findings.map(renderFindingLine),
  for (final warning in result.warnings) 'warning: $warning',
  '${result.findings.length} findings in ${result.scannedFiles} files under '
      '${result.roots.join(', ')}',
].join('\n');
