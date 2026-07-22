use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub fn rusqlite_tip(
    info: &CrateInfo,
    _files: &[FileContext],
    _cfg: &BaselineConfig,
) -> Vec<Diagnostic> {
    let has_rusqlite = info
        .manifest
        .get("dependencies")
        .and_then(|deps| deps.get("rusqlite"))
        .is_some();

    if !has_rusqlite {
        return Vec::new();
    }

    vec![Diagnostic {
        path: info.root.join("Cargo.toml"),
        line: 1,
        rule: "rusqlite",
        severity: Severity::Tip,
        message: "rusqlite detected — consider a typed data layer (sqlx compile-time-checked queries via query_file_as!, or SeaORM); hand-rolled Row→struct mappings become generated/typed code".into(),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn crate_info(manifest_extra: &str) -> CrateInfo {
        let root =
            std::env::temp_dir().join(format!("bl-rusqlite-tip-test-{}", manifest_extra.len()));
        std::fs::remove_dir_all(&root).ok();
        std::fs::create_dir_all(&root).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            format!("[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n{manifest_extra}"),
        )
        .unwrap();
        CrateInfo::load(&root).unwrap()
    }

    #[test]
    fn flags_rusqlite_dependency() {
        let info = crate_info("[dependencies]\nrusqlite = \"0.40\"\n");
        let d = rusqlite_tip(&info, &[], &BaselineConfig::default());
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "rusqlite");
        assert_eq!(d[0].path, info.root.join("Cargo.toml"));
        assert_eq!(d[0].line, 1);
    }

    #[test]
    fn no_tip_without_rusqlite() {
        let info = crate_info("");
        assert!(rusqlite_tip(&info, &[], &BaselineConfig::default()).is_empty());
    }
}
