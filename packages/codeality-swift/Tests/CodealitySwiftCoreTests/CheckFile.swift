@testable import CodealitySwiftCore

/// The structural findings for one file written into a fresh fixture.
func checkFile(
  _ path: String, _ text: String, yaml: String = "roots: [Sources]\ntest-roots: [Tests]\n"
) throws -> [Finding] {
  let fixture = Fixture()
  fixture.config(yaml)
  fixture.write(path, text)
  let config = try loadConfig(projectRoot: fixture.root)
  return try checkSourceFile(try parseSourceFile(projectRoot: fixture.root, path: path, config: config), config)
}

/// Just the codes.
func codes(_ path: String, _ text: String, yaml: String = "roots: [Sources]\ntest-roots: [Tests]\n")
  throws -> [RuleCode]
{
  try checkFile(path, text, yaml: yaml).map(\.code)
}
