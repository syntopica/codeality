import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/no_grab_bag_names.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  List<String?> subjects(String path) => [
    for (final finding in NoGrabBagNames().check(
      project.file(path, 'class A {}'),
      project.loaded,
    ))
      finding.subject,
  ];

  test('banned names as a directory segment or a file stem', () {
    expect(subjects('lib/utils/a.dart'), ['utils']);
    expect(subjects('lib/Helpers.dart'), ['Helpers']);
    expect(subjects('lib/common/misc.dart'), ['common', 'misc']);
    expect(subjects('test/helpers/fake.dart'), ['helpers']);
  });

  test('only whole segments match', () {
    expect(subjects('lib/utilsx.dart'), isEmpty);
    expect(subjects('lib/string_utils.dart'), isEmpty);
  });

  test('findings carry the rule code', () {
    expect(
      NoGrabBagNames()
          .check(project.file('lib/utils.dart', 'class A {}'), project.loaded)
          .single
          .code,
      RuleCode.bdt003,
    );
  });
}
