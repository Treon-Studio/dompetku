import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '~/constants/app';

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SESSION_SECRET: string;
  GA4_ANALYTICS_ID?: string;
  RESEND_API_KEY: string;
  NODE_ENV: string;
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
  FIREBASE_MEASUREMENT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
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
    return typeof process !== 'undefined' ? process.env.SESSION_SECRET ?? '' : '';
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
  get FIREBASE_API_KEY() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_API_KEY : undefined;
  },
  get FIREBASE_AUTH_DOMAIN() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_AUTH_DOMAIN : undefined;
  },
  get FIREBASE_PROJECT_ID() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : undefined;
  },
  get FIREBASE_STORAGE_BUCKET() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_STORAGE_BUCKET : undefined;
  },
  get FIREBASE_MESSAGING_SENDER_ID() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_MESSAGING_SENDER_ID : undefined;
  },
  get FIREBASE_APP_ID() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_APP_ID : undefined;
  },
  get FIREBASE_MEASUREMENT_ID() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_MEASUREMENT_ID : undefined;
  },
  get FIREBASE_CLIENT_EMAIL() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_CLIENT_EMAIL : undefined;
  },
  get FIREBASE_PRIVATE_KEY() {
    return typeof process !== 'undefined' ? process.env.FIREBASE_PRIVATE_KEY : undefined;
  },
};

export const SESSION_SECRET = env.SESSION_SECRET;
export const GA4_ANALYTICS_ID = env.GA4_ANALYTICS_ID;
export const RESEND_API_KEY = env.RESEND_API_KEY;
export const NODE_ENV = env.NODE_ENV;
