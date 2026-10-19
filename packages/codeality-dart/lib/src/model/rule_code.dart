/// Every structural rule. Codes are immutable and never reused.
enum RuleCode {
  bdt000('parse-error'),
  bdt001('one-primary-unit'),
  bdt002('file-matches-unit'),
  bdt003('no-grab-bag-names'),
  bdt004('max-file-lines'),
  bdt005('barrel-only'),
  bdt006('no-inline-sql'),
  bdt007('no-hand-written-part');

  const RuleCode(this.slug);

  final String slug;

  /// The printed code, such as `BDT001`.
  String get code => name.toUpperCase();
}
