import { Resend } from 'resend';
import { RESEND_API_KEY } from '~/env';

let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}