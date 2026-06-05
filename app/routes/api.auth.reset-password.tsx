import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';

import { createDbClient } from '~/core/db.server';
import { hashPassword } from '~/features/auth/api.server';
import { getCloudflareEnv } from '~/env';
import { ResetPasswordSchema } from '~/features/auth/schemas';
import { logger } from '~/core/logger.server';
import { password_resets, users } from '~/core/db/schema';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = getCloudflareEnv(context);
    const db = createDbClient(env);
    const body = await request.json();
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      const error = result.error.issues[0];
      return json({ message: error.message }, { status: 400 });
    }

    const { token, password } = result.data;

    const [resetRecord] = await db.select().from(password_resets).where(eq(password_resets.token, token)).limit(1);

    if (!resetRecord || resetRecord.used) {
      return json({ message: 'Invalid or already used reset link' }, { status: 400 });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return json({ message: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db.update(users).set({ password: passwordHash }).where(eq(users.id, resetRecord.user_id));
    await db.update(password_resets).set({ used: true }).where(eq(password_resets.id, resetRecord.id));

    return json({ message: 'Password reset successfully. You can now sign in with your new password.' }, { status: 200 });
  } catch (error: any) {
    logger.error('Reset password error', { error: String(error) });
    return json({ message: 'An error occurred' }, { status: 500 });
  }
}
