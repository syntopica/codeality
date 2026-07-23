use std::path::{Path, PathBuf};

use anyhow::Context;

pub struct CrateInfo {
    pub root: PathBuf,
    pub manifest: toml::Value,
    pub is_workspace_root: bool,
    pub member_roots: Vec<PathBuf>,
}

impl CrateInfo {
    pub fn load(dir: &Path) -> anyhow::Result<Self> {
        let manifest_path = dir.join("Cargo.toml");
        let raw = std::fs::read_to_string(&manifest_path)
            .with_context(|| format!("reading {}", manifest_path.display()))?;
        let manifest: toml::Value = raw
            .parse()
            .with_context(|| format!("parsing {}", manifest_path.display()))?;

        let is_workspace_root = manifest.get("workspace").is_some();

        let mut member_roots = Vec::new();
        if let Some(members) = manifest
            .get("workspace")
            .and_then(|workspace| workspace.get("members"))
            .and_then(|members| members.as_array())
        {
            for member in members {
                let Some(pattern) = member.as_str() else {
                    continue;
                };

                if pattern.contains('*') {
                    let (prefix, name_pattern) = match pattern.rsplit_once('/') {
                        Some((prefix, name_pattern)) => (prefix, name_pattern),
                        None => ("", pattern),
                    };
                    // v1: only a bare trailing `*` segment (e.g. `crates/*`) is supported.
                    if name_pattern != "*" {
                        continue;
                    }
                    let base = if prefix.is_empty() {
                        dir.to_path_buf()
                    } else {
                        dir.join(prefix)
                    };
                    let Ok(entries) = std::fs::read_dir(&base) else {
                        continue;
                    };
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() && path.join("Cargo.toml").is_file() {
                            member_roots.push(path);
                        }
                    }
                } else {
                    let path = dir.join(pattern);
                    if path.join("Cargo.toml").is_file() {
                        member_roots.push(path);
                    }
                }
            }
        }
        member_roots.sort();

        Ok(Self {
            root: dir.to_path_buf(),
            manifest,
            is_workspace_root,
            member_roots,
        })
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn expands_trailing_glob_member_to_dirs_with_cargo_toml() {
        let root = std::env::temp_dir().join("bl-crate-info-glob-expand");
        std::fs::remove_dir_all(&root).ok();
        std::fs::create_dir_all(root.join("crates/a")).unwrap();
        std::fs::create_dir_all(root.join("crates/b")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[workspace]\nmembers=[\"crates/*\"]\n",
        )
        .unwrap();
        std::fs::write(
            root.join("crates/a/Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();
        // crates/b intentionally has no Cargo.toml.

        let info = CrateInfo::load(&root).unwrap();

        assert_eq!(info.member_roots, vec![root.join("crates/a")]);
    }
}
