use std::collections::HashSet;
use std::path::PathBuf;

use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;

/// Whether the whole file is test scope, so structural rules should skip it.
///
/// Three forms count. A `tests` directory *inside the crate's own `src`* is a
/// test module tree; the component is only honoured after the last `src`
/// because `check` walks `<crate>/src` and a crate can itself live under a
/// `tests/` directory - this crate's own fixtures do, and matching on the
/// whole path would exempt every one of them.
///
/// A `#![cfg(test)]` inner attribute is how a file reached through
/// `#[cfg(test)] mod tests;` declares itself: the compiler only builds it
/// under test, and without this it was scanned as production code - SQL
/// fixtures flagged, its length charged to the crate's budget.
///
/// A `<crate>/tests` directory - cargo's integration tests - is the third:
/// `check` walks it as a second root, and it is recognised by the *absence*
/// of any `src` component, which is what separates it from a fixture crate
/// parked under a `tests/` path.
///
/// The fourth is `declared_test_scope`, the files some other file in the crate
/// reaches through `#[cfg(test)] mod name;`. Nothing inside such a file says
/// so, which is why it needed the declaring module to be read too - see
/// `cfg_test_module_paths`.
pub fn is_test_scope_file(ctx: &FileContext, declared_test_scope: &HashSet<PathBuf>) -> bool {
    if is_cfg_test_item(&ctx.ast.attrs) || declared_test_scope.contains(&ctx.path) {
        return true;
    }
    let components: Vec<_> = ctx
        .path
        .components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect();
    let Some(src_index) = components.iter().rposition(|c| c == "src") else {
        return components.iter().any(|c| c == "tests");
    };
    components[src_index..].iter().any(|c| c == "tests")
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use std::path::Path;

    fn ctx(path: &str, src: &str) -> FileContext {
        FileContext::parse(Path::new(path), src.into()).unwrap()
    }

    fn is_test_scope_file(ctx: &FileContext) -> bool {
        super::is_test_scope_file(ctx, &HashSet::new())
    }

    #[test]
    fn detects_a_tests_module_tree_inside_src() {
        assert!(is_test_scope_file(&ctx("src/db/tests/mod.rs", "")));
    }

    #[test]
    fn detects_the_inner_cfg_test_attribute() {
        assert!(is_test_scope_file(&ctx(
            "src/db/tests.rs",
            "#![cfg(test)]\n"
        )));
    }

    #[test]
    fn leaves_production_files_alone() {
        assert!(!is_test_scope_file(&ctx(
            "src/db/queries.rs",
            "fn a() {}\n"
        )));
    }

    #[test]
    fn file_named_attests_is_not_a_tests_dir() {
        assert!(!is_test_scope_file(&ctx("src/attests.rs", "fn a() {}\n")));
    }

    #[test]
    fn detects_a_cargo_integration_test() {
        assert!(is_test_scope_file(&ctx("tests/check_integration.rs", "")));
        assert!(is_test_scope_file(&ctx(
            "/w/packages/cargo-baseline/tests/init_integration.rs",
            ""
        )));
    }

    #[test]
    fn honours_a_file_declared_under_cfg_test_elsewhere() {
        let declared: HashSet<PathBuf> =
            [PathBuf::from("src/ops/hash_cache_tests.rs")].into();
        let file = ctx("src/ops/hash_cache_tests.rs", "fn a() {}\n");
        assert!(super::is_test_scope_file(&file, &declared));
        assert!(!super::is_test_scope_file(&file, &HashSet::new()));
    }

    #[test]
    fn a_crate_living_under_a_tests_directory_is_still_production() {
        // This crate's own fixtures sit at tests/fixtures/<crate>/src/*.rs.
        assert!(!is_test_scope_file(&ctx(
            "tests/fixtures/bad-crate/src/store.rs",
            "fn a() {}\n"
        )));
    }
}
