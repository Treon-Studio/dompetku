import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import FeedbackEmail from 'emails/feedback';

import { requireUser } from '~/lib/auth.server';
import { getResend } from '~/lib/email';
import prisma from '~/lib/prisma';

import { emails } from '~/constants/messages';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const { message } = await request.json();
	try {
		await prisma.feedbacks.create({ data: { message, user_id: user.id } });
		await getResend().emails.send({
			from: emails.from,
			subject: emails.feedback.subject,
			to: emails.email,
			reply_to: user.email,
			react: FeedbackEmail({ message, email: user.email }),
		});
		return json({ message: emails.feedback.sent }, { status: 201 });
	} catch (error: any) {
		return json({ error: { message: emails.feedback.failed } }, { status: 500 });
	}
}