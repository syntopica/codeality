// The trap from verticagtm, 2026-10-04: with `extends: true` each project's
// include is added to the root's, so both files also run in the dom project.
export default {
  test: {
    include: ['src/**/*.test.mjs'],
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/dom.test.mjs'],
        },
      },
      { extends: true, test: { name: 'node', environment: 'node' } },
    ],
  },
}
