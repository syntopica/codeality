import 'package:codeality_dart/src/model/rule_code.dart';
import 'package:codeality_dart/src/rules/looks_like_sql.dart';
import 'package:codeality_dart/src/rules/no_inline_sql.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  int findings(String text, [String path = 'lib/a.dart']) =>
      NoInlineSql().check(project.file(path, text), project.loaded).length;

  test('prose that mentions select and from is not SQL', () {
    expect(looksLikeSql('Select an option from the menu below'), isFalse);
  });

  test('statement shapes are SQL', () {
    expect(looksLikeSql('SELECT id, name FROM users WHERE id = ?'), isTrue);
    expect(looksLikeSql('select\n  id\nfrom\n  users'), isTrue);
    expect(looksLikeSql('INSERT INTO users (id) VALUES (?)'), isTrue);
    expect(looksLikeSql('UPDATE users SET name = ?'), isTrue);
    expect(looksLikeSql('DELETE FROM users WHERE id = ?'), isTrue);
    expect(looksLikeSql('CREATE TABLE users (id INTEGER)'), isTrue);
  });

  test('a SQL string literal is a finding with the rule code', () {
    final found = NoInlineSql()
        .check(
          project.file(
            'lib/a.dart',
            "const q = 'SELECT id, name FROM songs WHERE id = ?';",
          ),
          project.loaded,
        )
        .single;
    expect(found.code, RuleCode.bdt006);
    expect(found.message, contains('**/*.drift'));
  });

  test('adjacent strings are joined and reported once', () {
    expect(findings("const q = 'SELECT id '\n    'FROM users';"), 1);
  });

  test('multi-line strings are read whole', () {
    expect(findings("const q = '''\nSELECT id\nFROM users\n''';"), 1);
  });

  test('interpolated strings use their static parts', () {
    expect(findings(r"String q(String t) => 'SELECT id FROM $t';"), 1);
  });

  test('drift customSelect with inline SQL is a finding', () {
    expect(findings("final r = db.customSelect('SELECT * FROM songs');"), 1);
  });

  test('tests are held to the same rule', () {
    expect(findings("const q = 'DELETE FROM users';", 'test/a_test.dart'), 1);
  });

  test('ordinary strings pass', () {
    expect(findings("const s = 'Select an option from the menu below';"), 0);
  });
}
