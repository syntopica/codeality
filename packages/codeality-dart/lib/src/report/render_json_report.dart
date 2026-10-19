import 'dart:convert';

import '../engine/check_result.dart';
import '../package_version.dart';
import 'report_schema_version.dart';
import 'finding_document.dart';
import 'findings_summary.dart';

/// The versioned machine-readable document. Only this goes to stdout.
String renderJsonReport(CheckResult result) =>
    const JsonEncoder.withIndent('  ').convert({
      'schema_version': reportSchemaVersion,
      'tool': {'name': 'codeality-dart', 'version': packageVersion},
      'roots': result.roots,
      'scanned_files': result.scannedFiles,
      'findings': result.findings.map(findingDocument).toList(),
      'warnings': result.warnings,
      'summary': findingsSummary(result.findings),
    });
