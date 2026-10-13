# code-policy/no-hidden-top-level-declarations

> **Forbid internal module-scoped logic and helpers.**

Files cannot contain private/unexported top-level declarations that hide
complexity. If a helper is needed, it should be extracted to its own file and
imported explicitly.

**Recommended:** Yes (`error`)  
**Fixable:** No
