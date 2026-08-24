use super::to_snake_case::to_snake_case;
use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::named_item::named_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct FileMatchesItem;

impl Rule for FileMatchesItem {
    fn name(&self) -> &'static str {
        "file-matches-item"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        // Get file stem (without .rs extension)
        let stem = ctx.path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

        // Skip special files
        if matches!(stem, "mod" | "lib" | "main" | "build") {
            return Vec::new();
        }

        // Check for grab-bag stems
        if matches!(stem, "utils" | "helpers" | "misc" | "common") {
            return vec![Diagnostic {
                path: ctx.path.clone(),
                line: 1,
                rule: self.name(),
                severity: Severity::Error,
                message: format!(
                    "grab-bag file name `{stem}.rs` - name files after their single unit"
                ),
            }];
        }

        // Find the FIRST unit (same kinds as one_primary_unit.rs, skipping cfg(test))
        let mut first_unit: Option<(String, usize)> = None;
        for item in &ctx.ast.items {
            let Some((name, attrs, span)) = named_item(item) else {
                continue;
            };

            // Skip if name is empty (e.g. unnamed macro)
            if name.is_empty() {
                continue;
            }

            // Skip cfg(test) items
            if is_cfg_test_item(attrs) {
                continue;
            }

            first_unit = Some((name, span.start().line));
            break;
        }

        // If no unit found, return empty (pure re-export or const-only)
        let Some((unit_name, line)) = first_unit else {
            return Vec::new();
        };

        // Check if the snake_case of unit name matches the stem
        let expected_snake = to_snake_case(&unit_name);
        if expected_snake != stem {
            return vec![Diagnostic {
                path: ctx.path.clone(),
                line,
                rule: self.name(),
                severity: Severity::Error,
                message: format!(
                    "file `{stem}.rs` does not match its primary item `{unit_name}` (expected `{expected_snake}.rs`)"
                ),
            }];
        }

        Vec::new()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use std::path::Path;

    fn check(path: &str, src: &str) -> Vec<Diagnostic> {
        let ctx = FileContext::parse(Path::new(path), src.into()).unwrap();
        FileMatchesItem.check(&ctx, &BaselineConfig::default())
    }

    #[test]
    fn grab_bag_utils_flagged() {
        let src = "pub fn helper() {}";
        let d = check("src/utils.rs", src);
        assert_eq!(d.len(), 1);
        assert!(d[0].message.contains("grab-bag"));
    }

    #[test]
    fn matching_struct_passes() {
        let src = "pub struct UserRepository;";
        let d = check("src/user_repository.rs", src);
        assert!(d.is_empty());
    }

    #[test]
    fn mismatched_struct_flagged() {
        let src = "pub struct SqliteStore;";
        let d = check("src/store.rs", src);
        assert_eq!(d.len(), 1);
        assert!(d[0].message.contains("sqlite_store.rs"));
    }

    #[test]
    fn unnamed_macro_first_item_is_skipped() {
        let src = "some_macro! { x } pub struct UserRepository;";
        let d = check("src/user_repository.rs", src);
        assert!(d.is_empty());
    }

    #[test]
    fn only_unnamed_macro_no_diagnostic() {
        let src = "some_macro! { x }";
        let d = check("src/anything.rs", src);
        assert!(d.is_empty());
    }
}
