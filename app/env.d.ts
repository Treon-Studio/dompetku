/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite/client" />

import "@remix-run/cloudflare";
import type { CloudflareEnv } from "./env";

declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "@remix-run/cloudflare" {
	interface AppLoadContext {
		cloudflare: {
			env: CloudflareEnv;
			ctx: ExecutionContext;
			cf: IncomingRequestCfProperties;
		};
	}
}

declare module "@remix-run/server-runtime" {
	interface AppLoadContext {
		cloudflare: {
			env: CloudflareEnv;
			ctx: ExecutionContext;
			cf: IncomingRequestCfProperties;
		};
	}
}
