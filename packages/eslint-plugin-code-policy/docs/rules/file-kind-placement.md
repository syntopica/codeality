# code-policy/file-kind-placement

> **Ensure files strictly follow kind-based naming and folder placement.**

Detects a file's kind from its name and requires the matching folder: `use*`
files belong in `hooks/`, `format*` and `*Formatter` in `formatters/`,
`validate*` and `*Validator` in `validators/`, `map*`, `*Mapper` and
`*Transformer` in `mappers/`, and `select*` and `*Selector` in `selectors/`.
PascalCase `.tsx`/`.jsx` components are exempt, and `utils/` and `helpers/`
folders are rejected unless `allowGenericFolders` is set. The check reads names
only; it does not verify what the code does.

**Options**

- `allowGenericFolders` (default `false`): permit `utils/` and `helpers/` at any
  depth as homes for pure helpers; files under such a folder are exempt from
  placement checks.
- `allowColocation` (default `false`): exempt a placement-checked unit (hook,
  mapper, formatter, validator, selector) when it is colocated with its consumer
  instead of orphaned in a purely technical folder. A folder counts as a
  colocation home when it holds an _anchor_ next to the unit: a public-API
  barrel (`index.*`), a component (`PascalCase.tsx`/`.jsx`), or any neighbouring
  code file that is not itself a placement-checked kind (the consumer). This
  matches modern feature-folder guidance — a single-consumer hook or util lives
  beside its consumer; only shared units graduate to a dedicated
  `hooks/`/`mappers/` folder. An orphaned unit with no anchor still flags.

```js
'code-policy/file-kind-placement': ['error', { allowGenericFolders: true, allowColocation: true }]
```

**Recommended:** Yes (`error`)  
**Fixable:** No
