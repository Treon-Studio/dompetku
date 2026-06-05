import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createDbClient } from '~/core/db.server';
import { getResend } from '~/shared/lib/email';
import { getCloudflareEnv } from '~/env';
import { findUserByIdentity, isPhone } from '~/features/auth/api.server';
import { emails } from '~/shared/constants/messages';
import { RESET_TOKEN_EXPIRY_MS } from '~/shared/constants/app';
import { ForgotPasswordSchema } from '~/features/auth/schemas';
import { logger } from '~/core/logger.server';
import { password_resets } from '~/core/db/schema';
import { resetPasswordEmailHtml } from '~/shared/lib/email-templates';

export async function action({ request, context }: ActionFunctionArgs) {
	try {
		const env = getCloudflareEnv(context);
		const db = createDbClient(env);
		const body = await request.json();
		const result = ForgotPasswordSchema.safeParse(body);

		if (!result.success) {
			const error = result.error.issues[0];
			return json({ message: error.message }, { status: 400 });
		}

		const { identity } = result.data;

		const user = await findUserByIdentity(identity, db);
		if (!user || !user.email) {
			return json({ message: 'If an account with that email exists, we sent a reset link.' }, { status: 200 });
		}

		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

		await db.insert(password_resets).values({ user_id: user.id, token, expires_at: expiresAt.toISOString() });

		const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;

		try {
			await getResend(env).emails.send({
				from: emails.from,
				subject: 'Reset your Dompetku password',
				to: user.email,
				html: resetPasswordEmailHtml(resetUrl),
			});
		} catch (error) {
			logger.error('Failed to send reset email', { error: String(error) });
		}

		return json({ message: 'If an account with that email exists, we sent a reset link.' }, { status: 200 });
	} catch (e: unknown) {
		const error = e as Error;
		logger.error('Forgot password error', { error: String(error) });
		return json({ message: 'An error occurred' }, { status: 500 });
	}
}
