/// The `.swift-format` init writes: Xcode's 4-space indentation, 120
/// columns, and swift-format's default rules otherwise.
public let swiftFormatConfig = """
    {
      "version": 1,
      "lineLength": 120,
      "indentation": {
        "spaces": 4
      },
      "respectsExistingLineBreaks": true,
      "lineBreakBeforeEachArgument": false
    }

    """
