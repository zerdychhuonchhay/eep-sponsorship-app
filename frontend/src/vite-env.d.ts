// Fix for "Cannot find type definition file for 'vite/client'." and "Property 'env' does not exist on type 'ImportMeta'".
// We provide manual type definitions for Vite's `import.meta.env` to ensure TypeScript compilation succeeds
// without relying on a potentially misconfigured or missing `vite/client` type reference.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // FIX: Added VITE_API_MOCKING to the environment variables type definition to resolve a TypeScript error.
  readonly VITE_API_MOCKING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
