/// The `.swift-format` init writes: swift-format's own defaults (2-space
/// indentation, 100 columns), which Flutter's generated Swift also follows.
public let swiftFormatConfig = """
  {
    "version": 1,
    "lineLength": 100,
    "indentation": {
      "spaces": 2
    },
    "respectsExistingLineBreaks": true,
    "lineBreakBeforeEachArgument": false
  }

  """
