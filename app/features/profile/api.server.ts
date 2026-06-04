import { PrismaClient } from '@prisma/client';
import { addYears } from 'date-fns';
import { hashPassword, verifyPassword, isPhone, normalizePhone } from '~/features/auth/api.server';
import { isEmail, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '~/constants/validation';

export async function getUserProfile(userId: string, db: PrismaClient) {
  const data = await db.users.findUnique({
    where: { id: userId },
    select: {
      currency: true,
      locale: true,
      billing_start_date: true,
      trial_start_date: true,
      order_status: true,
      usage: true,
      email: true,
      phone: true,
      plan_status: true,
      new_signup_email: true,
      created_at: true,
    },
  });

  const isPremiumPlan = data?.order_status === 'paid' && data?.plan_status === 'premium';
  const isPremiumPlanEnded =
    isPremiumPlan && data?.billing_start_date && new Date() > addYears(new Date(data.billing_start_date), 1);
  const isPremium = isPremiumPlan && !isPremiumPlanEnded;

  return { ...data, isPremium, isPremiumPlanEnded };
}

export async function updateUserProfile(userId: string, body: any, currentUserPasswordHash: string, db: PrismaClient) {
  const updateData: Record<string, any> = {};

  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.locale !== undefined) updateData.locale = body.locale;

  if (body.email !== undefined) {
    if (body.email && !isEmail(body.email)) {
      throw new Error('Please enter a valid email address');
    }
    updateData.email = body.email || null;
  }

  if (body.phone !== undefined) {
    if (body.phone && !isPhone(body.phone)) {
      throw new Error('Please enter a valid phone number');
    }
    updateData.phone = body.phone ? normalizePhone(body.phone) : null;
  }

  if (body.currentPassword && body.newPassword) {
    const valid = await verifyPassword(body.currentPassword, currentUserPasswordHash);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }
    if (body.newPassword.length < PASSWORD_MIN_LENGTH || body.newPassword.length > PASSWORD_MAX_LENGTH) {
      throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
    }
    updateData.password = await hashPassword(body.newPassword);
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields to update');
  }

  await db.users.update({ data: updateData, where: { id: userId } });
}

export async function deleteUserAndData(userId: string, db: PrismaClient) {
  await db.$transaction([
    db.sessions.deleteMany({ where: { user_id: userId } }),
    db.feedbacks.deleteMany({ where: { user_id: userId } }),
    db.expenses.deleteMany({ where: { user_id: userId } }),
    db.income.deleteMany({ where: { user_id: userId } }),
    db.investments.deleteMany({ where: { user_id: userId } }),
    db.subscriptions.deleteMany({ where: { user_id: userId } }),
    db.users.delete({ where: { id: userId } }),
  ]);
}

export async function upgradeUserPlan(userId: string, body: any, db: PrismaClient) {
  const { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number } = body;

  const requiredFields = { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Invalid or missing field: ${key}`);
    }
  }

  const validPlanStatuses = ['basic', 'premium'] as const;
  const validOrderStatuses = ['pending', 'paid', 'failed'] as const;
  if (!validPlanStatuses.includes(plan_status as any)) {
    throw new Error('Invalid plan_status');
  }
  if (!validOrderStatuses.includes(order_status as any)) {
    throw new Error('Invalid order_status');
  }

  await db.users.update({
    data: { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number },
    where: { id: userId },
  });
}

export async function incrementUserUsage(userId: string, db: PrismaClient) {
  await db.users.update({ data: { usage: { increment: 1 } }, where: { id: userId } });
}
