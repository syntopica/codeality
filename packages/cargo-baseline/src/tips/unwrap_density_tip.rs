use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::production_unwrap_lines::production_unwrap_lines;
use crate::engine::severity::Severity;

/// Flags a crate that leans on `.unwrap()` / `.expect()` instead of typed
/// errors.
///
/// The count is production-only and the tip is anchored to the file that
/// contributes the most calls, at its first one. Reporting a crate-wide total
/// against whichever file happened to be parsed first sent readers to a
/// 20-line module and blamed it for the whole crate.
pub fn unwrap_density_tip(files: &[FileContext], cfg: &BaselineConfig) -> Vec<Diagnostic> {
    let per_file: Vec<(&FileContext, Vec<usize>)> = files
        .iter()
        .map(|ctx| (ctx, production_unwrap_lines(ctx)))
        .filter(|(_, lines)| !lines.is_empty())
        .collect();

    let total: usize = per_file.iter().map(|(_, lines)| lines.len()).sum();
    if total <= cfg.unwrap_density {
        return Vec::new();
    }

    let Some((worst, lines)) = per_file.iter().max_by_key(|(_, lines)| lines.len()) else {
        return Vec::new();
    };
    let here = lines.len();

    vec![Diagnostic {
        path: worst.path.clone(),
        line: lines.first().copied().unwrap_or(1),
        rule: "unwrap-density",
        severity: Severity::Tip,
        message: format!(
            "{total} unwrap()/expect() calls outside test code, {here} in this file - consolidate errors with thiserror"
        ),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::parse_file_ctx::parse_file_ctx;

    #[test]
    fn flags_when_over_threshold() {
        let cfg = BaselineConfig {
            unwrap_density: 2,
            ..BaselineConfig::default()
        };
        let files = vec![parse_file_ctx(
            "src/a.rs",
            "fn a() { x.unwrap(); y.unwrap(); z.expect(\"z\"); }",
        )];
        let d = unwrap_density_tip(&files, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "unwrap-density");
        assert_eq!(d[0].path, std::path::PathBuf::from("src/a.rs"));
        assert!(d[0].message.contains("3 unwrap()/expect() calls"));
    }

    #[test]
    fn no_tip_under_threshold() {
        let cfg = BaselineConfig::default();
        let files = vec![parse_file_ctx("src/a.rs", "fn a() { x.unwrap(); }")];
        assert!(unwrap_density_tip(&files, &cfg).is_empty());
    }

    #[test]
    fn no_tip_when_no_files() {
        let cfg = BaselineConfig::default();
        assert!(unwrap_density_tip(&[], &cfg).is_empty());
    }

    #[test]
    fn does_not_count_test_code() {
        let cfg = BaselineConfig {
            unwrap_density: 1,
            ..BaselineConfig::default()
        };
        let files = vec![parse_file_ctx(
            "src/a.rs",
            "fn a() { x.unwrap(); }\n#[cfg(test)]\nmod tests {\n    fn t() { a.unwrap(); b.unwrap(); }\n}\n",
        )];
        assert!(unwrap_density_tip(&files, &cfg).is_empty());
    }

    #[test]
    fn anchors_the_tip_to_the_worst_offender() {
        let cfg = BaselineConfig {
            unwrap_density: 2,
            ..BaselineConfig::default()
        };
        let files = vec![
            parse_file_ctx("src/small.rs", "fn a() { x.unwrap(); }\n"),
            parse_file_ctx(
                "src/big.rs",
                "fn b() {\n    x.unwrap();\n    y.unwrap();\n    z.unwrap();\n}\n",
            ),
        ];
        let d = unwrap_density_tip(&files, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].path, std::path::PathBuf::from("src/big.rs"));
        assert_eq!(d[0].line, 2);
        assert!(d[0].message.contains("4 unwrap()/expect() calls"));
        assert!(d[0].message.contains("3 in this file"));
    }
}
