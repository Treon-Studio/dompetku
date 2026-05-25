let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

export { getResend };