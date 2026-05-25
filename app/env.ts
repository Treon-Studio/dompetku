export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SESSION_SECRET: string;
  GA4_ANALYTICS_ID?: string;
  RESEND_API_KEY: string;
  NODE_ENV: string;
}

export interface CloudflareEnv extends Env {}

export function getCloudflareEnv(context: { cloudflare: { env: CloudflareEnv } }): CloudflareEnv {
  return context.cloudflare.env;
}

export const env: Env = {
  get TURSO_DATABASE_URL() {
    return typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL ?? '' : '';
  },
  get TURSO_AUTH_TOKEN() {
    return typeof process !== 'undefined' ? process.env.TURSO_AUTH_TOKEN ?? '' : '';
  },
  get SESSION_SECRET() {
    return typeof process !== 'undefined' ? process.env.SESSION_SECRET ?? 'default-secret-change-me' : 'default-secret-change-me';
  },
  get GA4_ANALYTICS_ID() {
    return typeof process !== 'undefined' ? process.env.GA4_ANALYTICS_ID : undefined;
  },
  get RESEND_API_KEY() {
    return typeof process !== 'undefined' ? process.env.RESEND_API_KEY ?? '' : '';
  },
  get NODE_ENV() {
    return typeof process !== 'undefined' ? process.env.NODE_ENV ?? 'development' : 'development';
  },
};

export const SESSION_SECRET = env.SESSION_SECRET;
export const GA4_ANALYTICS_ID = env.GA4_ANALYTICS_ID;
export const RESEND_API_KEY = env.RESEND_API_KEY;
export const NODE_ENV = env.NODE_ENV;
