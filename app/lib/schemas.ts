import { z } from 'zod';
import {
  INPUT_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  URL_MAX_LENGTH,
  PRICE_MAX_VALUE,
} from '~/constants/validation';

export const baseRecordSchema = z.object({
  id: z.string().optional(), // For PUT requests
  name: z.string().min(1, 'Name is required').max(INPUT_MAX_LENGTH, `Name must be at most ${INPUT_MAX_LENGTH} characters`),
  notes: z.string().max(NOTES_MAX_LENGTH, `Notes must be at most ${NOTES_MAX_LENGTH} characters`).optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required (YYYY-MM-DD)'),
  price: z.string()
    .min(1, 'Valid price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num >= 0 && num <= PRICE_MAX_VALUE;
    }, 'Valid price is required'),
});











export const AuthIdentitySchema = z.object({
  identity: z.string().min(1, 'Email or phone number is required').refine((val) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isPhone = /^\+?[1-9]\d{6,14}$/.test(val);
    return isEmail || isPhone;
  }, 'Please enter a valid email or phone number'),
});

export const AuthPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be at most 128 characters'),
});

export const SignupSchema = AuthIdentitySchema.merge(AuthPasswordSchema);
export const SigninSchema = AuthIdentitySchema.merge(AuthPasswordSchema);
export const ForgotPasswordSchema = AuthIdentitySchema;
export const ResetPasswordSchema = AuthPasswordSchema.extend({
  token: z.string().min(1, 'Token is required').regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid token format'),
});
