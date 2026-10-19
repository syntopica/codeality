import Foundation

/// Every `.swift` file under the roots and test roots, sorted and
/// project-relative. A root that does not exist is reported through [warn].
public func collectSourceFiles(root: String, config: SwiftConfig, warn: (String) -> Void) -> [String] {
  var files = Set<String>()
  for directory in config.roots + config.testRoots {
    var isDirectory: ObjCBool = false
    let path = URL(fileURLWithPath: root).appendingPathComponent(directory).path
    guard FileManager.default.fileExists(atPath: path, isDirectory: &isDirectory), isDirectory.boolValue
    else {
      warn("root \(directory) does not exist")
      continue
    }
    files.formUnion(walkRoot(projectRoot: root, root: directory))
  }
  return files.sorted()
}
