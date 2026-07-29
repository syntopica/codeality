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
                message: "member does not inherit workspace lints - add `[lints] workspace = true` to its Cargo.toml"
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
    use crate::engine::temp_workspace_and_member::temp_workspace_and_member;

    /// Creates a temp workspace root with `[workspace.lints.clippy]` set and
    /// one member `crates/a` whose Cargo.toml is `member_manifest`.
    fn crate_info_with_workspace_lints(dir_name: &str, member_manifest: &str) -> CrateInfo {
        let (root, member) = temp_workspace_and_member(dir_name);
        std::fs::write(
            root.join("Cargo.toml"),
            "[workspace]\nmembers=[\"crates/a\"]\n[workspace.lints.clippy]\nunwrap_used=\"deny\"\n",
        )
        .unwrap();
        std::fs::write(member.join("Cargo.toml"), member_manifest).unwrap();
        CrateInfo::load(&root).unwrap()
    }

    #[test]
    fn flags_member_missing_lints_inheritance() {
        let info = crate_info_with_workspace_lints(
            "bl-lints-flags-missing",
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        );
        assert_eq!(check_lints_inheritance(&info).len(), 1);
    }

    #[test]
    fn member_with_lints_workspace_true_has_no_diagnostics() {
        let info = crate_info_with_workspace_lints(
            "bl-lints-workspace-true",
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n[lints]\nworkspace = true\n",
        );
        assert!(check_lints_inheritance(&info).is_empty());
    }
}
