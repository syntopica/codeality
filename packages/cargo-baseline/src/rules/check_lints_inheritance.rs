use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::severity::Severity;

pub fn check_lints_inheritance(info: &CrateInfo) -> Vec<Diagnostic> {
    let has_workspace_lints = info
        .manifest
        .get("workspace")
        .and_then(|workspace| workspace.get("lints"))
        .is_some();

    if !(info.is_workspace_root && has_workspace_lints) {
        return Vec::new();
    }

    let mut diagnostics = Vec::new();

    for member_root in &info.member_roots {
        let manifest_path = member_root.join("Cargo.toml");

        let manifest: toml::Value = match std::fs::read_to_string(&manifest_path)
            .ok()
            .and_then(|raw| raw.parse().ok())
        {
            Some(manifest) => manifest,
            None => {
                diagnostics.push(Diagnostic {
                    path: manifest_path,
                    line: 1,
                    rule: "lints-inheritance",
                    severity: Severity::Error,
                    message: "cannot read member Cargo.toml".to_string(),
                });
                continue;
            }
        };

        let inherits_workspace_lints = manifest
            .get("lints")
            .and_then(|lints| lints.get("workspace"))
            .and_then(|workspace| workspace.as_bool())
            .unwrap_or(false);

        if !inherits_workspace_lints {
            diagnostics.push(Diagnostic {
                path: manifest_path,
                line: 1,
                rule: "lints-inheritance",
                severity: Severity::Error,
                message:
                    "member does not inherit workspace lints — add `[lints]\nworkspace = true`"
                        .to_string(),
            });
        }
    }

    diagnostics
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::crate_info::CrateInfo;

    #[test]
    fn flags_member_missing_lints_inheritance() {
        let root = std::env::temp_dir().join("bl-lints-test");
        std::fs::remove_dir_all(&root).ok();
        let member = root.join("crates/a");
        std::fs::create_dir_all(member.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[workspace]\nmembers=[\"crates/a\"]\n[workspace.lints.clippy]\nunwrap_used=\"deny\"\n",
        )
        .unwrap();
        std::fs::write(
            member.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();
        let info = CrateInfo::load(&root).unwrap();
        assert_eq!(check_lints_inheritance(&info).len(), 1);
    }

    #[test]
    fn member_with_lints_workspace_true_has_no_diagnostics() {
        let root = std::env::temp_dir().join("bl-lints-inherits-test");
        std::fs::remove_dir_all(&root).ok();
        let member = root.join("crates/a");
        std::fs::create_dir_all(member.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[workspace]\nmembers=[\"crates/a\"]\n[workspace.lints.clippy]\nunwrap_used=\"deny\"\n",
        )
        .unwrap();
        std::fs::write(
            member.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n[lints]\nworkspace = true\n",
        )
        .unwrap();
        let info = CrateInfo::load(&root).unwrap();
        assert!(check_lints_inheritance(&info).is_empty());
    }
}
