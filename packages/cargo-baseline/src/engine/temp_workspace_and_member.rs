#[cfg(test)]
use std::path::PathBuf;

/// Creates a temp workspace root named `dir_name` plus a member crate at
/// `crates/a` (with its own `src/`). Callers write both Cargo.toml manifests.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn temp_workspace_and_member(dir_name: &str) -> (PathBuf, PathBuf) {
    let root = std::env::temp_dir().join(dir_name);
    std::fs::remove_dir_all(&root).ok();
    let member = root.join("crates/a");
    std::fs::create_dir_all(member.join("src")).unwrap();
    (root, member)
}
