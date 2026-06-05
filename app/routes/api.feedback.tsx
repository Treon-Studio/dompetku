import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { feedbackEmailHtml } from '~/shared/lib/email-templates';
import { feedbacks } from '~/core/db/schema';
import { requireUser } from '~/features/auth/api.server';
import { getResend } from '~/shared/lib/email';
import { createDbClient } from '~/core/db.server';
import { getCloudflareEnv } from '~/env';

import { emails } from '~/shared/constants/messages';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const env = getCloudflareEnv(context);
	const user = await requireUser(request, db, context);
	const { message } = await request.json();
	try {
		await db.insert(feedbacks).values({ message, user_id: user.id });
		await getResend(env).emails.send({
			from: emails.from,
			subject: emails.feedback.subject,
			to: emails.email,
			reply_to: user.email || user.phone || undefined,
			html: feedbackEmailHtml(message, user.email || user.phone || ''),
		});
		return json({ message: emails.feedback.sent }, { status: 201 });
	} catch (error: any) {
		return json({ message: emails.feedback.failed }, { status: 500 });
	}
}
