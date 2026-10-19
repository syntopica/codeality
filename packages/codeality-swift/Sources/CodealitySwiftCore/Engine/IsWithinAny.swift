/// Whether [path] is one of [scopes] or below one; no scopes means all.
func isWithinAny(_ path: String, _ scopes: [String]) -> Bool {
    scopes.isEmpty
        || scopes.contains { scope in
            let trimmed = scope.hasSuffix("/") ? String(scope.dropLast()) : scope
            return path == trimmed || path.hasPrefix(trimmed + "/")
        }
}
