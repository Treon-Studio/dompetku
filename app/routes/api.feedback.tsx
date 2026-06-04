import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import FeedbackEmail from 'emails/feedback';

import { requireUser } from '~/features/auth/api.server';
import { getResend } from '~/shared/lib/email';
import { createPrismaClient } from '~/core/db.server';
import { getCloudflareEnv } from '~/env';

import { emails } from '~/shared/constants/messages';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const env = getCloudflareEnv(context);
	const user = await requireUser(request, db, context);
	const { message } = await request.json();
	try {
		await db.feedbacks.create({ data: { message, user_id: user.id } });
		await getResend(env).emails.send({
			from: emails.from,
			subject: emails.feedback.subject,
			to: emails.email,
			reply_to: user.email || user.phone || undefined,
			react: FeedbackEmail({ message, email: user.email || user.phone || '' }),
		});
		return json({ message: emails.feedback.sent }, { status: 201 });
	} catch (error: any) {
		return json({ message: emails.feedback.failed }, { status: 500 });
	}
}
