/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

interface CloudflareEnv {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SESSION_SECRET: string;
  NODE_ENV: string;
  RESEND_API_KEY: string;
  GA4_ANALYTICS_ID?: string;
}

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
      cf: IncomingRequestCfProperties;
    };
  }
}
