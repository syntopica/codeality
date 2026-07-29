#[cfg(test)]
use crate::engine::crate_info::CrateInfo;

/// Creates a fresh temp directory named `dir_name` holding a minimal
/// single-package `Cargo.toml`, and loads it as `CrateInfo`.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn temp_crate_info(dir_name: &str) -> CrateInfo {
    let root = std::env::temp_dir().join(dir_name);
    std::fs::remove_dir_all(&root).ok();
    std::fs::create_dir_all(&root).unwrap();
    std::fs::write(
        root.join("Cargo.toml"),
        "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
    )
    .unwrap();
    CrateInfo::load(&root).unwrap()
}
