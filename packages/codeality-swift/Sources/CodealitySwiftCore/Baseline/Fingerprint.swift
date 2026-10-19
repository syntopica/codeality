import Crypto
import Foundation

/// A stable identity for a finding. The line number is deliberately left
/// out: inserting a line above a violation must not make it look new.
public func fingerprint(section: String, code: String, path: String, context: String) -> String {
    let material = ["\(fingerprintVersion)", section, code, path, context].joined(separator: "|")
    let digest = SHA256.hash(data: Array(material.utf8))
    return String(digest.map { String(format: "%02x", $0) }.joined().prefix(16))
}
