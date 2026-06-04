import { z } from 'zod';

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
