export function runSynchronousCruise(operation, configPath) {
  const result = operation(configPath)
  if (
    result !== null &&
    (typeof result === 'object' || typeof result === 'function') &&
    typeof result.then === 'function'
  ) {
    throw new TypeError('withCruiseTsconfig requires a synchronous operation')
  }
  return result
}
