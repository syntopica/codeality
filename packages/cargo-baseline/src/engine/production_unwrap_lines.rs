use crate::engine::cfg_test_line_ranges::cfg_test_line_ranges;
use crate::engine::file_context::FileContext;
use crate::engine::is_test_scope_file::is_test_scope_file;

/// Line numbers of every `.unwrap()` / `.expect(` call that is *not* test code,
/// one entry per call.
///
/// A panic in a test is the assertion, not a defect, so counting them is what
/// made the crate's own `unwrap-density` tip report a number it could not act
/// on. Whole test-scope files drop out, and inside a production file the
/// inline `#[cfg(test)] mod` ranges do too - the same asymmetry
/// `max-file-lines` already corrects. Comment lines are skipped as well: the
/// scan is textual, so prose naming the calls it counts would count itself.
pub fn production_unwrap_lines(ctx: &FileContext) -> Vec<usize> {
    if is_test_scope_file(ctx) {
        return Vec::new();
    }
    let test_ranges = cfg_test_line_ranges(&ctx.ast);
    ctx.source
        .lines()
        .enumerate()
        .map(|(index, text)| (index + 1, text))
        .filter(|(line, _)| !test_ranges.iter().any(|&(a, b)| *line >= a && *line <= b))
        .filter(|(_, text)| !text.trim_start().starts_with("//"))
        .flat_map(|(line, text)| {
            let calls = text.matches(".unwrap()").count() + text.matches(".expect(").count();
            std::iter::repeat_n(line, calls)
        })
        .collect()
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::parse_file_ctx::parse_file_ctx;

    #[test]
    fn reports_one_entry_per_call_with_its_line() {
        let ctx = parse_file_ctx(
            "src/a.rs",
            "fn a() {\n    x.unwrap();\n    y.expect(\"y\");\n}\n",
        );
        assert_eq!(production_unwrap_lines(&ctx), vec![2, 3]);
    }

    #[test]
    fn counts_repeated_calls_on_one_line() {
        let ctx = parse_file_ctx("src/a.rs", "fn a() { x.unwrap().y.unwrap(); }\n");
        assert_eq!(production_unwrap_lines(&ctx), vec![1, 1]);
    }

    #[test]
    fn skips_inline_cfg_test_modules() {
        let ctx = parse_file_ctx(
            "src/a.rs",
            "fn a() { x.unwrap(); }\n#[cfg(test)]\nmod tests {\n    fn t() { y.unwrap(); }\n}\n",
        );
        assert_eq!(production_unwrap_lines(&ctx), vec![1]);
    }

    #[test]
    fn skips_comment_lines() {
        let ctx = parse_file_ctx(
            "src/a.rs",
            "// calls .unwrap() here\nfn a() { x.unwrap(); }\n",
        );
        assert_eq!(production_unwrap_lines(&ctx), vec![2]);
    }

    #[test]
    fn skips_whole_test_scope_files() {
        let ctx = parse_file_ctx("src/db/tests/mod.rs", "fn t() { x.unwrap(); }\n");
        assert!(production_unwrap_lines(&ctx).is_empty());
    }
}
