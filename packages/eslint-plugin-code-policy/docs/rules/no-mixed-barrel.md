# code-policy/no-mixed-barrel

> **Forbid `index.*` files that mix re-exports with inline declarations.**

An `index.ts`, `index.tsx` or `index.js` that re-exports from other modules must
not also declare and export its own code. Keep the barrel a pure list of
re-exports, or move the declarations to their own files. An index file without
re-exports is not checked.

**Recommended:** Yes (`error`)  
**Fixable:** No
