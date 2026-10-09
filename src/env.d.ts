/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_LOGIN_API_BASE_URL: string
  readonly VITE_API_BASE_URL_GEODILE?: string
  readonly VITE_API_BASE_URL_GEODILE_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}