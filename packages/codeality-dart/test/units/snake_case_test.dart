import 'package:codeality_dart/src/units/snake_case.dart';
import 'package:test/test.dart';

void main() {
  test('converts identifiers to file stems', () {
    expect(snakeCase('FooBar'), 'foo_bar');
    expect(snakeCase('_FooBarState'), 'foo_bar_state');
    expect(snakeCase('HTTPClient'), 'http_client');
    expect(snakeCase('parseV2Config'), 'parse_v2_config');
    expect(snakeCase('a'), 'a');
  });
}
