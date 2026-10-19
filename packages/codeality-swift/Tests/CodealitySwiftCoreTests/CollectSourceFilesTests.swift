import Testing

@testable import CodealitySwiftCore

@Suite struct CollectSourceFilesTests {
  @Test func anXcodeGroupYieldsOnlySwiftFiles() throws {
    let fixture = Fixture()
    fixture.config("roots: [Runner]\ntest-roots: [RunnerTests]\n")
    fixture.write("Runner/AppDelegate.swift", "")
    fixture.write("Runner/Info.plist", "<plist/>")
    fixture.write("Runner/Assets.xcassets/Contents.json", "{}")
    fixture.write("Runner/Views/Beat.swift", "")
    fixture.write("Runner/.build/Junk.swift", "")
    fixture.write("RunnerTests/BeatTests.swift", "")
    var warnings: [String] = []
    let files = collectSourceFiles(
      root: fixture.root, config: try loadConfig(projectRoot: fixture.root)
    ) { warnings.append($0) }
    #expect(
      files == [
        "Runner/AppDelegate.swift", "Runner/Views/Beat.swift", "RunnerTests/BeatTests.swift",
      ])
    #expect(warnings.isEmpty)
  }

  @Test func aMissingRootIsAWarning() throws {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\n")
    var warnings: [String] = []
    let files = collectSourceFiles(
      root: fixture.root, config: try loadConfig(projectRoot: fixture.root)
    ) { warnings.append($0) }
    #expect(files.isEmpty)
    #expect(warnings == ["root Sources does not exist"])
  }
}
