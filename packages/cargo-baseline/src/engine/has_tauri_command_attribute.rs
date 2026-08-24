/// Whether the attributes carry `#[tauri::command]`.
///
/// Matched on the full path segments rather than the last one, so a local
/// `#[command]` from some other macro is not mistaken for a Tauri command.
pub fn has_tauri_command_attribute(attrs: &[syn::Attribute]) -> bool {
    attrs.iter().any(|a| {
        let segments: Vec<_> = a
            .path()
            .segments
            .iter()
            .map(|s| s.ident.to_string())
            .collect();
        segments == ["tauri", "command"]
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_the_qualified_path() {
        let f: syn::ItemFn = syn::parse_quote! { #[tauri::command] fn a() {} };
        assert!(has_tauri_command_attribute(&f.attrs));
    }

    #[test]
    fn ignores_a_bare_command_attribute() {
        let f: syn::ItemFn = syn::parse_quote! { #[command] fn a() {} };
        assert!(!has_tauri_command_attribute(&f.attrs));
    }

    #[test]
    fn ignores_an_unattributed_fn() {
        let f: syn::ItemFn = syn::parse_quote! { fn a() {} };
        assert!(!has_tauri_command_attribute(&f.attrs));
    }
}
