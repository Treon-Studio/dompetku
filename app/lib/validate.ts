import { json } from '@remix-run/cloudflare';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  INPUT_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  URL_MAX_LENGTH,
  isEmail,
  isRequired,
  isValidDate,
  isValidPrice,
  isValidUrl,
  UUID_REGEX,
} from '~/constants/validation';

export function validateRequired(value: unknown, field: string): string | null {
  if (!isRequired(value)) return `${field} is required`;
  return null;
}

export function validateMaxLength(value: string | undefined, max: number, field: string): string | null {
  if (value && value.length > max) return `${field} must be at most ${max} characters`;
  return null;
}

export function validateIdentityField(identity: unknown, isPhoneFn: (s: string) => boolean): string | null {
  if (!isRequired(identity)) return 'Email or phone number is required';
  const str = identity as string;
  if (!isEmail(str) && !isPhoneFn(str)) return 'Please enter a valid email or phone number';
  return null;
}

export function validatePasswordField(password: unknown): string | null {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  return null;
}

export function validateRecordFields(body: Record<string, unknown>): Response | null {
  const { name, notes, price, category, date } = body;

  const nameError = validateRequired(name, 'Name') || validateMaxLength(name as string, INPUT_MAX_LENGTH, 'Name');
  if (nameError) return json({ message: nameError }, { status: 400 });

  const notesError = validateMaxLength(notes as string | undefined, NOTES_MAX_LENGTH, 'Notes');
  if (notesError) return json({ message: notesError }, { status: 400 });

  if (!category || typeof category !== 'string') return json({ message: 'Category is required' }, { status: 400 });

  if (!date || typeof date !== 'string' || !isValidDate(date)) return json({ message: 'Valid date is required (YYYY-MM-DD)' }, { status: 400 });

  if (price === undefined || price === null || typeof price !== 'string' || !isValidPrice(price)) return json({ message: 'Valid price is required' }, { status: 400 });

  return null;
}

export function validateSubscriptionFields(body: Record<string, unknown>): Response | null {
  const { name, notes, price, url, paid, date } = body;

  const nameError = validateRequired(name, 'Name') || validateMaxLength(name as string, INPUT_MAX_LENGTH, 'Name');
  if (nameError) return json({ message: nameError }, { status: 400 });

  const notesError = validateMaxLength(notes as string | undefined, NOTES_MAX_LENGTH, 'Notes');
  if (notesError) return json({ message: notesError }, { status: 400 });

  if (!url || typeof url !== 'string' || !isValidUrl(url)) return json({ message: 'Valid URL is required' }, { status: 400 });
  const urlLenError = validateMaxLength(url, URL_MAX_LENGTH, 'URL');
  if (urlLenError) return json({ message: urlLenError }, { status: 400 });

  if (!paid || typeof paid !== 'string') return json({ message: 'Billing cycle is required' }, { status: 400 });

  if (!date || typeof date !== 'string' || !isValidDate(date)) return json({ message: 'Valid date is required (YYYY-MM-DD)' }, { status: 400 });

  if (price === undefined || price === null || typeof price !== 'string' || !isValidPrice(price)) return json({ message: 'Valid price is required' }, { status: 400 });

  return null;
}

export function validateResetToken(token: unknown): string | null {
  if (!token || typeof token !== 'string') return 'Token is required';
  if (!UUID_REGEX.test(token)) return 'Invalid token format';
  return null;
}
