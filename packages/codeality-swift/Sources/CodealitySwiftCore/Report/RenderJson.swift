import Foundation

/// [document] as indented JSON with sorted keys.
func renderJson(_ document: [String: Any]) -> String {
  let data = (try? JSONSerialization.data(withJSONObject: document, options: [.prettyPrinted, .sortedKeys])) ?? Data()
  return String(decoding: data, as: UTF8.self)
}
