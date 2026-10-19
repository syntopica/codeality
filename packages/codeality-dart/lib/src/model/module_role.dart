/// What a file is. Exactly one role per file, assigned before any rule runs.
enum ModuleRole {
  excluded,
  generated,
  test,
  barrel,
  entrypoint,
  data,
  ordinary,
}
