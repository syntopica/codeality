import 'suppression.dart';
import 'suppression_patterns.dart';

/// Every suppression comment in [text]. A file-wide one without a reason is
/// not a suppression.
List<Suppression> parseSuppressions(String text) {
  final lines = text.split('\n');
  return [
    for (var i = 0; i < lines.length; i++)
      if (SuppressionPatterns.fileWide.firstMatch(lines[i]) case final match?)
        Suppression(match.namedGroup('code')!, null)
      else if (SuppressionPatterns.inline.firstMatch(lines[i])
          case final match?)
        Suppression(match.namedGroup('code')!, i + 1),
  ];
}
