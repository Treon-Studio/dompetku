import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { configureLogger, logger } from "~/core/logger.server";
import { getCloudflareEnv } from "~/env";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	loadContext: AppLoadContext,
) {
	try {
		const env = getCloudflareEnv(loadContext);
		if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
			configureLogger({
				projectId: env.FIREBASE_PROJECT_ID,
				clientEmail: env.FIREBASE_CLIENT_EMAIL,
				privateKey: env.FIREBASE_PRIVATE_KEY,
			});
		}
	} catch {
		// Cloudflare env not available (e.g. local dev without full proxy)
	}

	const body = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
		signal: request.signal,
		onError(error: unknown) {
			if (error instanceof Error && error.message.includes("Controller is already closed")) {
				return;
			}
			logger.error("SSR render error", { error: String(error) });
			responseStatusCode = 500;
		},
	});

	if (isbot(request.headers.get("user-agent") || "")) {
		await body.allReady;
	}

	responseHeaders.set("Content-Type", "text/html");
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
