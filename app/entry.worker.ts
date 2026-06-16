/// <reference lib="WebWorker" />

import { CacheFirst, logger, NetworkFirst } from "@remix-pwa/sw";

declare let self: ServiceWorkerGlobalScope;

const ASSETS_CACHE = "assets-cache-v1";
const DATA_CACHE = "data-cache-v1";

const assetStrategy = new CacheFirst(ASSETS_CACHE, {
	maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
});

const dataStrategy = new NetworkFirst(DATA_CACHE);

self.addEventListener("install", (event) => {
	logger.log("Service Worker: Installing...");
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	logger.log("Service Worker: Activated");
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Static assets
	if (
		url.pathname.startsWith("/build/") ||
		url.pathname.startsWith("/icons/") ||
		url.pathname.startsWith("/favicon.ico")
	) {
		event.respondWith(assetStrategy.handleRequest(event.request));
		return;
	}

	// GET requests for data/pages
	if (event.request.method === "GET") {
		event.respondWith(dataStrategy.handleRequest(event.request));
		return;
	}
});
