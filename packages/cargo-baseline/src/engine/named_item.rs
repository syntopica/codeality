use syn::spanned::Spanned;

/// Extracts the `(name, attrs, span)` of an item's primary identifier, for
/// the item kinds `one-primary-unit` and `file-matches-item` both treat as
/// "units": fn, struct, enum, trait, type alias, union, and named macro
/// invocations. Returns `None` for any other item kind.
pub fn named_item(item: &syn::Item) -> Option<(String, &[syn::Attribute], proc_macro2::Span)> {
    let (name, attrs, span) = match item {
        syn::Item::Fn(i) => (i.sig.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Struct(i) => (i.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Enum(i) => (i.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Trait(i) => (i.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Type(i) => (i.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Union(i) => (i.ident.to_string(), i.attrs.as_slice(), i.span()),
        syn::Item::Macro(i) => (
            i.ident
                .as_ref()
                .map(ToString::to_string)
                .unwrap_or_default(),
            i.attrs.as_slice(),
            i.span(),
        ),
        _ => return None,
    };
    Some((name, attrs, span))
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn extracts_struct_name() {
        let item: syn::Item = syn::parse_quote! { pub struct UserRepository; };
        let (name, _, _) = named_item(&item).unwrap();
        assert_eq!(name, "UserRepository");
    }

    #[test]
    fn unnamed_macro_has_empty_name() {
        let item: syn::Item = syn::parse_quote! { some_macro! { x } };
        let (name, _, _) = named_item(&item).unwrap();
        assert_eq!(name, "");
    }

    #[test]
    fn unsupported_item_kind_is_none() {
        let item: syn::Item = syn::parse_quote! { use std::path::PathBuf; };
        assert!(named_item(&item).is_none());
    }
}
