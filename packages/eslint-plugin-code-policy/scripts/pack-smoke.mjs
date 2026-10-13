// Lints with the packed tarball, not the working tree: what a consumer installs
// is `files` + `exports` + the built `dist`, and a subpath that exists in `src`
// but not in the tarball, or a CJS entry that loads but exposes no rules, only
// shows up there.
import { runPackSmoke } from './pack-smoke/run-pack-smoke.mjs'

process.exitCode = await runPackSmoke(new URL('..', import.meta.url).pathname)
