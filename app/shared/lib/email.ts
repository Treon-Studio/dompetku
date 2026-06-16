import { Resend } from "resend";
import type { CloudflareEnv } from "~/env";

export function getResend(env: CloudflareEnv): Resend {
	return new Resend(env.RESEND_API_KEY);
}
