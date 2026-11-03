// The single-file components ship as source for the site's own Vite build to compile (the theme's
// compiled code never imports Vue). This shim lets tsc re-export them from the components barrel
// without depending on Vue's types: the site's build gives them their real types.

declare module '*.vue' {
  const component: Record<string, unknown>;
  export default component;
}
