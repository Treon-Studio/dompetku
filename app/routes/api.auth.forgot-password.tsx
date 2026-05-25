import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createPrismaClient } from '~/lib/prisma';
import { getResend } from '~/lib/email';
import { getCloudflareEnv } from '~/env';
import { findUserByIdentity, isPhone } from '~/lib/auth.server';
import { emails } from '~/constants/messages';

import ResetPasswordEmail from 'emails/reset-password';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = getCloudflareEnv(context);
    const db = createPrismaClient(env);
    const body = await request.json();
    const identity = body.identity;

    if (!identity) {
      return json({ message: 'Email or phone number is required' }, { status: 400 });
    }

    const user = await findUserByIdentity(identity, db);
    if (!user || !user.email) {
      return json({ message: 'If an account with that email exists, we sent a reset link.' }, { status: 200 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await db.password_resets.create({
      data: { user_id: user.id, token, expires_at: expiresAt },
    });

    const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;

    try {
      await getResend(env).emails.send({
        from: emails.from,
        subject: 'Reset your Dompetku password',
        to: user.email,
        react: ResetPasswordEmail({ action_link: resetUrl }),
      });
    } catch (error) {
      console.error('Failed to send reset email:', error);
    }

    return json({ message: 'If an account with that email exists, we sent a reset link.' }, { status: 200 });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return json({ message: error.message || 'An error occurred' }, { status: 500 });
  }
}
