import '../model/finding.dart';
import '../model/location.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';

/// BDT000 for a file the parser could not read cleanly, or null.
Finding? parseErrorFinding(SourceFile file) {
  if (file.parseErrors.isEmpty) return null;
  final first = file.parseErrors.first;
  final location = file.lineInfo.getLocation(first.offset);
  return Finding(
    code: RuleCode.bdt000,
    message: 'file does not parse: ${first.message}',
    location: Location(file.path, location.lineNumber, location.columnNumber),
  );
}
