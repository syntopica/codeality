import Testing

@Suite struct CLITests {
  @Test func versionPrintsTheToolAndVersion() throws {
    let result = try runBinary(["--version"])
    #expect(result.status == 0)
    #expect(
      result.stdout.trimmingCharacters(in: .whitespacesAndNewlines) == "codeality-swift 0.1.0")
  }

  @Test func unknownSubcommandIsAConfigurationError() throws {
    let result = try runBinary(["nonsense"])
    #expect(result.status == 2)
    #expect(!result.stderr.isEmpty)
  }
}
