import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Next 16.3 flipped TypeScript checking to the `tsc` CLI by default, and
    // it locates that CLI through the resolved `typescript` package's own
    // `bin.tsc` entry. This project installs TypeScript under the npm alias
    // `typescript: npm:@typescript/typescript6`, whose package.json declares
    // `bin.tsc6` and no `bin.tsc`, so the lookup returns nothing and `next
    // build` aborts with "It looks like you're trying to use TypeScript but do
    // not have the required package(s) installed" - after helpfully running
    // `pnpm install --save-dev typescript` over the alias first.
    //
    // Switching back to the compiler API path fixes it: the API entry
    // (`lib/typescript.js`) resolves through the alias normally, and the build
    // type-checks exactly as it did on 16.2.x. Drop this flag once the alias
    // ships a `tsc` bin, or once the project moves to a real `typescript`
    // package. Removing it while the alias is in place pins Next to 16.2.x and
    // brings back the `sharp` and PostCSS advisory overrides that move
    // unblocked.
    useTypeScriptCli: false,
  },
}

export default nextConfig
