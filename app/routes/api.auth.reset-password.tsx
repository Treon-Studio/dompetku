import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createPrismaClient } from '~/lib/prisma';
import { hashPassword } from '~/lib/auth.server';
import { getCloudflareEnv } from '~/env';
import { validateResetToken, validatePasswordField } from '~/lib/validate';
import { logger } from '~/lib/logger';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = getCloudflareEnv(context);
    const db = createPrismaClient(env);
    const body = await request.json();
    const token = body.token;
    const password = body.password;

    const tokenError = validateResetToken(body.token);
    if (tokenError) return json({ message: tokenError }, { status: 400 });

    const passwordError = validatePasswordField(body.password);
    if (passwordError) return json({ message: passwordError }, { status: 400 });

    const resetRecord = await db.password_resets.findUnique({ where: { token } });

    if (!resetRecord || resetRecord.used) {
      return json({ message: 'Invalid or already used reset link' }, { status: 400 });
    }

    if (resetRecord.expires_at < new Date()) {
      return json({ message: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.users.update({
        where: { id: resetRecord.user_id },
        data: { password: passwordHash },
      }),
      db.password_resets.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return json({ message: 'Password reset successfully. You can now sign in with your new password.' }, { status: 200 });
  } catch (error: any) {
    logger.error('Reset password error', { error: String(error) });
    return json({ message: 'An error occurred' }, { status: 500 });
  }
}
