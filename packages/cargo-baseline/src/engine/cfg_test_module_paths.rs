use std::collections::HashSet;
use std::path::{Path, PathBuf};

use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;

/// The files a crate reaches only through `#[cfg(test)] mod name;`.
///
/// A file declared that way is compiled only under test, but nothing inside it
/// says so: read on its own it is ordinary code, and every structural rule
/// charged it as production. Measured in `~/p/consumer-t`, that counted 23 test
/// `unwrap()` calls as production and pinned the crate's whole total on one
/// file. The documented remedy was for the adopter to add `#![cfg(test)]` at
/// the top of each such file - a tax on every adopter for a limitation of
/// ours, when the declaring `mod` is already in the ASTs we parsed.
///
/// Resolution follows the 2018 edition: a `mod bar;` in `lib.rs`, `main.rs` or
/// `<dir>/mod.rs` resolves against that file's own directory, and in any other
/// `foo.rs` against `foo/`. Both `bar.rs` and `bar/mod.rs` are returned,
/// because which one exists is not this function's business - a path that no
/// file has simply never matches.
///
/// Test scope is inherited: a plain `mod deeper;` inside a file already
/// reached under `cfg(test)` is test scope too, so the walk repeats until it
/// stops finding new files.
pub fn cfg_test_module_paths(files: &[FileContext]) -> HashSet<PathBuf> {
    let mut found: HashSet<PathBuf> = HashSet::new();
    loop {
        let before = found.len();
        for ctx in files {
            let inherited = found.contains(&ctx.path);
            for item in &ctx.ast.items {
                let syn::Item::Mod(module) = item else {
                    continue;
                };
                // Only the `mod name;` form names another file; `mod name {}`
                // is right here and already carries its own attributes.
                if module.content.is_some() {
                    continue;
                }
                if !inherited && !is_cfg_test_item(&module.attrs) {
                    continue;
                }
                found.extend(child_paths(&ctx.path, &module.ident.to_string()));
            }
        }
        if found.len() == before {
            return found;
        }
    }
}

fn child_paths(declaring: &Path, name: &str) -> Vec<PathBuf> {
    let Some(parent) = declaring.parent() else {
        return Vec::new();
    };
    let stem = declaring
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned());
    let directory = match stem.as_deref() {
        Some("mod" | "lib" | "main") | None => parent.to_path_buf(),
        Some(stem) => parent.join(stem),
    };
    vec![
        directory.join(format!("{name}.rs")),
        directory.join(name).join("mod.rs"),
    ]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn ctx(path: &str, src: &str) -> FileContext {
        FileContext::parse(Path::new(path), src.into()).unwrap()
    }

    #[test]
    fn resolves_a_sibling_module_declared_under_cfg_test() {
        let files = vec![ctx(
            "src/ops/mod.rs",
            "#[cfg(test)]\nmod hash_cache_tests;\n",
        )];
        let found = cfg_test_module_paths(&files);
        assert!(found.contains(Path::new("src/ops/hash_cache_tests.rs")));
        assert!(found.contains(Path::new("src/ops/hash_cache_tests/mod.rs")));
    }

    #[test]
    fn resolves_against_the_declaring_files_own_directory() {
        // 2018 edition: `src/ops.rs` owns `src/ops/`.
        let files = vec![ctx("src/ops.rs", "#[cfg(test)]\nmod helpers;\n")];
        let found = cfg_test_module_paths(&files);
        assert!(found.contains(Path::new("src/ops/helpers.rs")));
    }

    #[test]
    fn ignores_a_plain_module_declaration() {
        let files = vec![ctx("src/lib.rs", "mod ops;\n")];
        assert!(cfg_test_module_paths(&files).is_empty());
    }

    #[test]
    fn ignores_an_inline_module() {
        let files = vec![ctx("src/lib.rs", "#[cfg(test)]\nmod tests { }\n")];
        assert!(cfg_test_module_paths(&files).is_empty());
    }

    #[test]
    fn inherits_test_scope_through_a_plain_child() {
        let files = vec![
            ctx("src/lib.rs", "#[cfg(test)]\nmod suite;\n"),
            ctx("src/suite.rs", "mod deeper;\n"),
        ];
        let found = cfg_test_module_paths(&files);
        assert!(found.contains(Path::new("src/suite.rs")));
        assert!(found.contains(Path::new("src/suite/deeper.rs")));
    }
}
