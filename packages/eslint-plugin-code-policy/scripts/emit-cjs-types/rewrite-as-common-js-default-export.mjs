// A `.d.cts` file whose matching `.cjs` does a bare `module.exports = value`
// must say `export = value;`, not `export default value;` -- the latter
// tells CommonJS consumers to read a `.default` property that does not
// exist on that runtime shape.
export function rewriteAsCommonJsDefaultExport(dtsContent) {
  return dtsContent.replace(/^export default (\w+);$/m, 'export = $1;')
}
