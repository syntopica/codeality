/// The `.swiftlint.yml` init writes. It disables the rules `swift format`
/// already enforces and the size rules codeality-swift owns (BSW001/BSW004),
/// so each finding has one owner.
public let swiftlintConfig = """
    # codeality-swift - https://github.com/syntopica/codeality
    # swift format owns layout and codeality-swift owns file size, so their
    # rules are disabled here.
    disabled_rules:
      - closing_brace
      - colon
      - comma
      - file_length
      - leading_whitespace
      - line_length
      - opening_brace
      - operator_whitespace
      - return_arrow_whitespace
      - statement_position
      - trailing_comma
      - trailing_newline
      - trailing_semicolon
      - trailing_whitespace
      - type_body_length
      - vertical_whitespace

    """
