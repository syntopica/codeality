// The environment variables this app reads, declared as real properties.
//
// Next inlines `process.env.NEXT_PUBLIC_*` by matching the member expression
// literally at build time, so the access in `src/env.ts` has to stay dot
// notation. Under `noPropertyAccessFromIndexSignature` that is an error
// against `ProcessEnv`'s index signature - unless the property exists, which
// is what this declaration does. The list doubles as the app's env contract:
// a variable that is not here is a typo, which is the point of the flag.
declare namespace NodeJS {
  // `interface`, not `type`, and it has to be: this augments Node's own
  // ProcessEnv by declaration merging, which only interfaces do. The
  // consistent-type-definitions rule is right everywhere else.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ProcessEnv {
    NEXT_PUBLIC_SITE_URL?: string
  }
}
