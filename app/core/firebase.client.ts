import { getAnalytics, logEvent } from "firebase/analytics";
import { initializeApp } from "firebase/app";

let app: ReturnType<typeof initializeApp> | null = null;
let analytics: ReturnType<typeof getAnalytics> | null = null;

export function initFirebase(config: {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId?: string;
}) {
	if (app) return { app, analytics };
	app = initializeApp(config);
	try {
		analytics = getAnalytics(app);
	} catch {
		// analytics not available (SSR or blocked)
	}
	return { app, analytics };
}

export function logException(description: string, fatal = false) {
	if (!analytics) return;
	try {
		logEvent(analytics, "exception", { description, fatal });
	} catch {
		// silently fail
	}
}

export function logEventToFirebase(name: string, params?: Record<string, unknown>) {
	if (!analytics) return;
	try {
		logEvent(analytics, name, params);
	} catch {
		// silently fail
	}
}

export function setUserId(id: string) {
	if (!analytics) return;
	try {
		const { setUserId } = require("firebase/analytics");
		setUserId(analytics, id);
	} catch {
		// silently fail
	}
}
