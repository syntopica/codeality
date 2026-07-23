use std::path::PathBuf;

use crate::engine::crate_info::CrateInfo;

/// Picks the crate directories that `check` should scan for a given root.
///
/// For a plain crate (or a workspace root with no members), this is just the
/// root itself. For a workspace root with members, this is normally the
/// member roots - but a root manifest can declare both `[package]` and
/// `[workspace]` (the implicit root member pattern), in which case the root's
/// own `src/` must be scanned too, or its violations go undetected.
pub fn select_crate_roots(info: &CrateInfo) -> Vec<PathBuf> {
    if !info.is_workspace_root || info.member_roots.is_empty() {
        return vec![info.root.clone()];
    }

    let mut roots = info.member_roots.clone();
    if info.manifest.get("package").is_some() {
        roots.push(info.root.clone());
    }
    roots
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::super::check_crate::check_crate;
    use super::*;
    use crate::config::BaselineConfig;

    #[test]
    fn includes_root_when_root_manifest_has_package_and_workspace() {
        let root = std::env::temp_dir().join("bl-select-roots-implicit-member");
        std::fs::remove_dir_all(&root).ok();
        let member = root.join("crates/a");
        std::fs::create_dir_all(member.join("src")).unwrap();
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[package]\nname=\"root\"\nversion=\"0.1.0\"\nedition=\"2024\"\n[workspace]\nmembers=[\"crates/a\"]\n",
        )
        .unwrap();
        std::fs::write(
            member.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();

        let info = CrateInfo::load(&root).unwrap();
        let roots = select_crate_roots(&info);

        assert_eq!(roots.len(), 2);
        assert!(roots.contains(&root));
        assert!(roots.contains(&member));
    }

    #[test]
    fn excludes_root_when_root_manifest_has_no_package() {
        let root = std::env::temp_dir().join("bl-select-roots-pure-workspace");
        std::fs::remove_dir_all(&root).ok();
        let member = root.join("crates/a");
        std::fs::create_dir_all(member.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[workspace]\nmembers=[\"crates/a\"]\n",
        )
        .unwrap();
        std::fs::write(
            member.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();

        let info = CrateInfo::load(&root).unwrap();
        let roots = select_crate_roots(&info);

        assert_eq!(roots, vec![member]);
    }

    #[test]
    fn root_src_violation_is_detected_when_root_is_also_a_package() {
        let root = std::env::temp_dir().join("bl-select-roots-root-violation");
        std::fs::remove_dir_all(&root).ok();
        let member = root.join("crates/a");
        std::fs::create_dir_all(member.join("src")).unwrap();
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[package]\nname=\"root\"\nversion=\"0.1.0\"\nedition=\"2024\"\n[workspace]\nmembers=[\"crates/a\"]\n",
        )
        .unwrap();
        std::fs::write(
            root.join("src/store.rs"),
            "pub fn a() {}\npub fn b() {}\n",
        )
        .unwrap();
        std::fs::write(
            member.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();
        std::fs::write(member.join("src/lib.rs"), "pub fn only() {}\n").unwrap();

        let info = CrateInfo::load(&root).unwrap();
        let roots = select_crate_roots(&info);
        let cfg = BaselineConfig::default();

        let diagnostics: Vec<_> = roots
            .iter()
            .flat_map(|r| check_crate(r, &cfg))
            .collect();

        assert!(
            diagnostics
                .iter()
                .any(|d| d.rule == "one-primary-unit" && d.path.starts_with(root.join("src"))),
            "expected a one-primary-unit diagnostic under the root's own src/, got: {diagnostics:?}"
        );
    }
}
