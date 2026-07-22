use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub fn unwrap_density_tip(
    info: &CrateInfo,
    files: &[FileContext],
    cfg: &BaselineConfig,
) -> Vec<Diagnostic> {
    let total: usize = files
        .iter()
        .map(|ctx| ctx.source.matches(".unwrap()").count() + ctx.source.matches(".expect(").count())
        .sum();

    if total <= cfg.unwrap_density {
        return Vec::new();
    }

    let path = files
        .first()
        .map_or_else(|| info.root.join("Cargo.toml"), |ctx| ctx.path.clone());

    vec![Diagnostic {
        path,
        line: 1,
        rule: "unwrap-density",
        severity: Severity::Tip,
        message: format!("{total} unwrap()/expect() calls — consolidate errors with thiserror"),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn crate_info(test_name: &str) -> CrateInfo {
        let root = std::env::temp_dir().join(format!("bl-unwrap-density-tip-{test_name}"));
        std::fs::remove_dir_all(&root).ok();
        std::fs::create_dir_all(&root).unwrap();
        std::fs::write(
            root.join("Cargo.toml"),
            "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
        )
        .unwrap();
        CrateInfo::load(&root).unwrap()
    }

    fn file_ctx(path: &str, src: &str) -> FileContext {
        FileContext::parse(std::path::Path::new(path), src.into()).unwrap()
    }

    #[test]
    fn flags_when_over_threshold() {
        let info = crate_info("over-threshold");
        let cfg = BaselineConfig {
            unwrap_density: 2,
            ..BaselineConfig::default()
        };
        let files = vec![file_ctx(
            "src/a.rs",
            "fn a() { x.unwrap(); y.unwrap(); z.expect(\"z\"); }",
        )];
        let d = unwrap_density_tip(&info, &files, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "unwrap-density");
        assert_eq!(d[0].path, std::path::PathBuf::from("src/a.rs"));
        assert!(d[0].message.contains("3 unwrap()/expect() calls"));
    }

    #[test]
    fn no_tip_under_threshold() {
        let info = crate_info("under-threshold");
        let cfg = BaselineConfig::default();
        let files = vec![file_ctx("src/a.rs", "fn a() { x.unwrap(); }")];
        assert!(unwrap_density_tip(&info, &files, &cfg).is_empty());
    }

    #[test]
    fn no_tip_when_no_files() {
        let info = crate_info("no-files");
        let cfg = BaselineConfig::default();
        assert!(unwrap_density_tip(&info, &[], &cfg).is_empty());
    }
}
