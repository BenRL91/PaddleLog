declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare {
 interface Env {
  LEEWAY_AUTH_MODE?:string;
  LEEWAY_WEB_ORIGIN?:string;
  SUPABASE_URL?:string;
  SUPABASE_PUBLISHABLE_KEY?:string;
  APPLE_BILLING_ENABLED?:string;
  APPLE_ISSUER_ID?:string;
  APPLE_KEY_ID?:string;
  APPLE_PRIVATE_KEY?:string;
  APPLE_BUNDLE_ID?:string;
  APPLE_ENVIRONMENT?:string;
  APPLE_APP_ID?:string;
  APPLE_ROOT_CERTIFICATES_JSON?:string;
 }
}
