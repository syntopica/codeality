use crate::engine::is_cfg_test_item::is_cfg_test_item;

/// Inclusive line ranges covered by the file's inline `#[cfg(test)] mod { .. }`
/// blocks, attributes included.
///
/// Rust keeps unit tests in the file they test, so a size budget that counts
/// those lines charges production code for its own tests. Every other rule
/// already skips cfg(test) items; this is what lets a line-counting rule do
/// the same.
pub fn cfg_test_line_ranges(ast: &syn::File) -> Vec<(usize, usize)> {
    ast.items
        .iter()
        .filter_map(|item| {
            let syn::Item::Mod(m) = item else {
                return None;
            };
            if !is_cfg_test_item(&m.attrs) {
                return None;
            }
            // Spans are read off single tokens rather than the item as a
            // whole: proc-macro2 cannot join spans on stable, so an item-level
            // span() collapses to its first token and would report an end line
            // at the start of the block.
            let (brace, _) = m.content.as_ref()?;
            let start = m
                .attrs
                .first()
                .map_or_else(|| m.mod_token.span, |a| a.pound_token.span)
                .start()
                .line;
            Some((start, brace.span.close().end().line))
        })
        .collect()
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn ast(src: &str) -> syn::File {
        syn::parse_file(src).unwrap()
    }

    #[test]
    fn covers_attribute_through_closing_brace() {
        let f = ast("fn a() {}\n#[cfg(test)]\nmod tests {\n    fn b() {}\n}\n");
        assert_eq!(cfg_test_line_ranges(&f), vec![(2, 5)]);
    }

    #[test]
    fn ignores_plain_modules() {
        let f = ast("mod plain {\n    fn b() {}\n}\n");
        assert!(cfg_test_line_ranges(&f).is_empty());
    }

    #[test]
    fn ignores_declaration_only_cfg_test_modules() {
        // `#[cfg(test)] mod tests;` has no braces, so it covers no lines here.
        let f = ast("#[cfg(test)]\nmod tests;\n");
        assert!(cfg_test_line_ranges(&f).is_empty());
    }
}
