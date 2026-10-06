/** The promise's value, or `onTimeout()` once `ms` pass without one. */
export const raceTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T,
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined
  const expired = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(onTimeout())
    }, ms)
  })
  try {
    return await Promise.race([promise, expired])
  } finally {
    clearTimeout(timer)
  }
}
