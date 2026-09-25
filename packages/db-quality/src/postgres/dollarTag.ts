import { randomBytes } from 'node:crypto'

/** A random `dbq_<hex>` dollar-quote tag whose `$tag$` never occurs in `text`, so quoting `text` with it cannot end early. */
export const dollarTag = (
  text: string,
  next: () => string = () => randomBytes(8).toString('hex'),
): string => {
  for (;;) {
    const tag = `dbq_${next()}`
    if (!text.includes(`$${tag}$`)) return tag
  }
}
