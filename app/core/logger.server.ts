import { writeLog } from "./gcloud-logging.server";

type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

type ServerConfig = {
	projectId: string;
	clientEmail: string;
	privateKey: string;
};

let serverConfig: ServerConfig | null = null;

export function configureLogger(config: ServerConfig) {
	serverConfig = config;
}

export const logger = {
	error(message: string, context?: Record<string, unknown>) {
		log("ERROR", message, context);
	},
	warning(message: string, context?: Record<string, unknown>) {
		log("WARNING", message, context);
	},
	info(message: string, context?: Record<string, unknown>) {
		log("INFO", message, context);
	},
	debug(message: string, context?: Record<string, unknown>) {
		log("DEBUG", message, context);
	},
	critical(message: string, context?: Record<string, unknown>) {
		log("CRITICAL", message, context);
	},
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
	const consoleFn =
		level === "CRITICAL" || level === "ERROR" ? console.error : level === "WARNING" ? console.warn : console.log;
	consoleFn(`[${level}] ${message}`, context || "");

	if (serverConfig) {
		writeLog(serverConfig.projectId, serverConfig.clientEmail, serverConfig.privateKey, level, message, context).catch(
			() => {},
		);
	}

	if (typeof window !== "undefined") {
		try {
			const { logException } = require("./firebase.client");
			if (level === "ERROR" || level === "CRITICAL") {
				logException(message, level === "CRITICAL");
			}
		} catch {
			// firebase not available
		}
	}
}
