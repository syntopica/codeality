import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/no_hand_written_part.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('a part pointing at a generated file passes (the drift shape)', () {
    const text =
        "import 'package:drift/drift.dart';\npart 'stagebeat_database.g.dart';\nclass StagebeatDatabase {}\n";
    expect(
      NoHandWrittenPart().check(
        project.file('lib/data/stagebeat_database.dart', text),
        project.loaded,
      ),
      isEmpty,
    );
  });

  test('a part pointing at a hand-written file is a finding', () {
    final finding = NoHandWrittenPart()
        .check(
          project.file('lib/db.dart', "part 'db_extra.dart';\nclass Db {}\n"),
          project.loaded,
        )
        .single;
    expect(finding.code, RuleCode.bdt007);
    expect(finding.subject, 'db_extra.dart');
  });

  test('part of in a hand-written file is a finding', () {
    expect(
      NoHandWrittenPart().check(
        project.file('lib/db_extra.dart', "part of 'db.dart';\nclass X {}\n"),
        project.loaded,
      ),
      hasLength(1),
    );
  });
}
