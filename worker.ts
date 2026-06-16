import { createRequestHandler, type ServerBuild } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

export default {
	fetch(request: Request, env: unknown, ctx: ExecutionContext) {
		const loadContext = {
			cloudflare: { env, ctx, cf: (request as Request & { cf?: unknown }).cf },
		};
		return createRequestHandler(build as unknown as ServerBuild)(request, loadContext);
	},
};
