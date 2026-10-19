import '../model/finding.dart';
import '../model/rule_code.dart';
import 'line_context.dart';

/// What identifies [finding] inside its file: nothing for file-level rules,
/// the subject for naming rules, the offending line otherwise.
String fingerprintContext(Finding finding, String text) =>
    switch (finding.code) {
      RuleCode.bdt001 || RuleCode.bdt004 => '',
      RuleCode.bdt002 || RuleCode.bdt003 => finding.subject ?? '',
      _ => lineContext(text, finding.location.line),
    };
