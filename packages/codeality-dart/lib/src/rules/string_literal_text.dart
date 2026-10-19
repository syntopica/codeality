import 'package:analyzer/dart/ast/ast.dart';

/// The static text of a string literal; each interpolation reads as `x`.
String stringLiteralText(StringLiteral literal) => switch (literal) {
  SimpleStringLiteral(:final value) => value,
  AdjacentStrings(:final strings) => strings.map(stringLiteralText).join(),
  StringInterpolation(:final elements) =>
    elements
        .map((element) => element is InterpolationString ? element.value : 'x')
        .join(),
};
