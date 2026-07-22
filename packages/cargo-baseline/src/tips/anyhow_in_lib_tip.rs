use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub fn anyhow_in_lib_tip(
    info: &CrateInfo,
    _files: &[FileContext],
    _cfg: &BaselineConfig,
) -> Vec<Diagnostic> {
    let has_lib = info.root.join("src/lib.rs").is_file();
    let has_main = info.root.join("src/main.rs").is_file();
    let has_anyhow = info
        .manifest
        .get("dependencies")
        .and_then(|deps| deps.get("anyhow"))
        .is_some();

    if !(has_lib && !has_main && has_anyhow) {
        return Vec::new();
    }

    vec![Diagnostic {
        path: info.root.join("Cargo.toml"),
        line: 1,
        rule: "anyhow-in-lib",
        severity: Severity::Tip,
        message: "anyhow in a library crate — prefer typed errors (thiserror); keep anyhow at binary edges".into(),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn crate_info(name: &str, manifest_extra: &str, has_lib: bool, has_main: bool) -> CrateInfo {
        let root = std::env::temp_dir().join(format!("bl-anyhow-lib-tip-test-{name}"));
        std::fs::remove_dir_all(&root).ok();
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            format!("[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n{manifest_extra}"),
        )
        .unwrap();
        if has_lib {
            std::fs::write(root.join("src/lib.rs"), "").unwrap();
        }
        if has_main {
            std::fs::write(root.join("src/main.rs"), "fn main() {}").unwrap();
        }
        CrateInfo::load(&root).unwrap()
    }

    #[test]
    fn flags_lib_only_crate_with_anyhow() {
        let info = crate_info("lib-only", "[dependencies]\nanyhow = \"1\"\n", true, false);
        let d = anyhow_in_lib_tip(&info, &[], &BaselineConfig::default());
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "anyhow-in-lib");
    }

    #[test]
    fn no_tip_when_main_rs_present() {
        let info = crate_info("with-main", "[dependencies]\nanyhow = \"1\"\n", true, true);
        assert!(anyhow_in_lib_tip(&info, &[], &BaselineConfig::default()).is_empty());
    }

    #[test]
    fn no_tip_without_anyhow() {
        let info = crate_info("no-anyhow", "", true, false);
        assert!(anyhow_in_lib_tip(&info, &[], &BaselineConfig::default()).is_empty());
    }
}
