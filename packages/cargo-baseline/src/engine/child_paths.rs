use std::path::{Path, PathBuf};

/// The two files a `mod name;` declared in `declaring` can live in, under the
/// 2018 edition: `lib.rs`, `main.rs` and `mod.rs` resolve against their own
/// directory, any other `foo.rs` against `foo/`.
pub fn child_paths(declaring: &Path, name: &str) -> Vec<PathBuf> {
    let Some(parent) = declaring.parent() else {
        return Vec::new();
    };
    let stem = declaring
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned());
    let directory = match stem.as_deref() {
        Some("mod" | "lib" | "main") | None => parent.to_path_buf(),
        Some(stem) => parent.join(stem),
    };
    vec![
        directory.join(format!("{name}.rs")),
        directory.join(name).join("mod.rs"),
    ]
}
