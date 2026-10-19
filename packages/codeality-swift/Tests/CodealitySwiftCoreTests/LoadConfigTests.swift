import Testing

@testable import CodealitySwiftCore

@Suite struct LoadConfigTests {
  @Test func readsRootsAndDefaults() throws {
    let fixture = Fixture()
    fixture.config("schema-version: 1\nroots: [Sources]\n")
    let config = try loadConfig(projectRoot: fixture.root)
    #expect(config.roots == ["Sources"])
    #expect(config.testRoots == [])
    #expect(config.maxFileLines == 150)
    #expect(config.testMaxFileLines == 300)
    #expect(config.generated.contains("**/GeneratedPluginRegistrant.*"))
  }

  @Test func anUnknownKeyIsAConfigError() {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\nroot: [Typo]\n")
    #expect(throws: ConfigError.self) { try loadConfig(projectRoot: fixture.root) }
  }

  @Test func missingRootsIsAConfigError() {
    let fixture = Fixture()
    fixture.config("schema-version: 1\n")
    #expect(throws: ConfigError.self) { try loadConfig(projectRoot: fixture.root) }
  }

  @Test func aMissingFileIsAConfigError() {
    #expect(throws: ConfigError.self) { try loadConfig(projectRoot: Fixture().root) }
  }

  @Test func anotherSchemaVersionIsAConfigError() {
    let fixture = Fixture()
    fixture.config("schema-version: 2\nroots: [Sources]\n")
    #expect(throws: ConfigError.self) { try loadConfig(projectRoot: fixture.root) }
  }
}
