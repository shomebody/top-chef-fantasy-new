/// <reference types="vite/client" />

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  // Add other env variables as needed, e.g.:
  // readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}