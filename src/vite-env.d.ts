/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JEONJU_API_KEY?: string;
  readonly VITE_TAGO_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
