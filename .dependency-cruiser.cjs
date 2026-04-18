// .dependency-cruiser.cjs
// See https://github.com/sverweij/dependency-cruiser for the full rule schema.
// Phase 2 of the code-quality-pass — encodes the layering rules from CLAUDE.md.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'A dependency cycle makes the code harder to reason about and test. If one appears, split the shared piece into its own module.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'ui-is-pure',
      severity: 'error',
      comment:
        'src/components/ui/** is the pure-UI layer (CLAUDE.md). It may only import React. No hooks, no domain, no other component layers, no lib.',
      from: { path: '^src/components/ui/' },
      to: {
        path: '.+',
        pathNot: [
          '^src/components/ui/',
          '^node_modules/(react|react-dom)($|/)',
          '^node_modules/@types/react($|/)',
        ],
      },
    },
    {
      name: 'dumb-no-hooks-or-app',
      severity: 'error',
      comment:
        'Dumb components (sidebar / map / layout) receive their data via props. They must not import hooks or app routes.',
      from: { path: '^src/components/(sidebar|map|layout)/' },
      to: { path: ['^src/hooks/', '^src/app/'] },
    },
    {
      name: 'hooks-no-components-or-app',
      severity: 'error',
      comment:
        'Hooks expose state and effects downward to components; they must not reach sideways into component code or upward into app routes.',
      from: { path: '^src/hooks/' },
      to: { path: ['^src/components/', '^src/app/'] },
    },
    {
      name: 'below-app-no-app',
      severity: 'error',
      comment:
        'src/app/** is the top of the tree. Nothing in components, hooks, or lib may reach into it — the dependency direction is always downward.',
      from: { path: '^src/(components|hooks|lib)/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'src/domain/** (created in Phase 4) must be framework-agnostic: no React, Next, Clerk, google.maps, hooks, components, app, or infrastructure. Pure inputs/outputs only.',
      from: { path: '^src/domain/' },
      to: {
        path: [
          '^src/hooks/',
          '^src/components/',
          '^src/app/',
          '^src/lib/db',
          '^src/lib/infrastructure/',
          '^node_modules/(react|react-dom|next|@clerk)($|/)',
        ],
      },
    },
    {
      name: 'infrastructure-boundaries',
      severity: 'error',
      comment:
        'src/lib/infrastructure/** (created in Phase 4) wraps external SDKs for the hook / component layers. It must not reach upward into hooks, components, or app.',
      from: { path: '^src/lib/infrastructure/' },
      to: { path: ['^src/hooks/', '^src/components/', '^src/app/'] },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: './tsconfig.json' },
    doNotFollow: { path: '^node_modules' },
    includeOnly: '^src/',
    exclude: {
      path: ['^src/__tests__/'],
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['main', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
