/** The colours a page may use: root custom properties by prefix, plus literal hex values. */
export type PaletteConfig = {
  variablePrefixes: string[]
  colors: string[]
  /** The one colour that marks the primary action (`#rgb` or `#rrggbb`); null when not given. */
  accent: string | null
}
