/**
 * How long a loaded page may keep requests open before it is measured anyway.
 * Some widgets never let the network go idle: Cloudflare Turnstile holds a
 * blob request open for the life of the page.
 */
export const SETTLE_TIMEOUT_MS = 5_000
