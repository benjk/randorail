/// <reference types="astro/client" />

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_FIREBASE_URL: string;
  readonly PUBLIC_FIREBASE_KEY: string;
  readonly PUBLIC_PUBLISH_FUNCTION_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
