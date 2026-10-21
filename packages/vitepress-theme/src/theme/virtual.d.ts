// Modules provided by the theme's Vite plugin (see src/config/plugin.ts).

declare module 'virtual:openlinkos/client' {
  /** The registrable domain for the language preference cookie, or null for host-only. */
  export const cookieDomain: string | null;
}
