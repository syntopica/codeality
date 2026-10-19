import Foundation

/// Project-relative POSIX paths of the `.swift` files under [root],
/// skipping excluded directories.
func walkRoot(projectRoot: String, root: String) -> [String] {
  let base = URL(fileURLWithPath: projectRoot).appendingPathComponent(root)
  let names = (try? FileManager.default.contentsOfDirectory(atPath: base.path)) ?? []
  var files: [String] = []
  for name in names.sorted() {
    var isDirectory: ObjCBool = false
    let path = base.appendingPathComponent(name).path
    guard FileManager.default.fileExists(atPath: path, isDirectory: &isDirectory) else { continue }
    if isDirectory.boolValue {
      if defaultExcludes.contains(name) { continue }
      files += walkRoot(projectRoot: projectRoot, root: root + "/" + name)
    } else if name.hasSuffix(".swift") {
      files.append(root + "/" + name)
    }
  }
  return files
}
