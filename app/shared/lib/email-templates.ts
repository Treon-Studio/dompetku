/**
 * Plain HTML email templates - replaces @react-email
 * Resend supports `html:` parameter natively
 */

const BASE_URL = 'https://dompetku.treonstudio.com';

export function resetPasswordEmailHtml(actionLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset Password - Dompetku</title>
</head>
<body style="background:#f9fafb;font-family:Inter,sans-serif;margin:0;padding:40px 0;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${BASE_URL}/icons/logo.png" width="50" height="50" alt="Dompetku" style="display:block;margin:0 auto 16px;" />
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0;">Reset Password</h1>
    </div>
    <p style="color:#374151;font-size:14px;line-height:24px;">Halo,</p>
    <p style="color:#374151;font-size:14px;line-height:24px;">
      Kami menerima permintaan untuk mereset password akun Dompetku Anda.
      Klik tombol di bawah ini untuk mengatur password baru. Link ini akan kadaluarsa dalam <strong>1 jam</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${actionLink}"
         style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:500;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:22px;">
      Atau copy URL ini ke browser Anda:<br/>
      <a href="${actionLink}" style="color:#7c3aed;word-break:break-all;font-size:12px;">${actionLink}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      Jika Anda tidak meminta reset password, abaikan email ini.<br/>
      &copy; ${new Date().getFullYear()} Dompetku by Treon Studio
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function feedbackEmailHtml(message: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Feedback - Dompetku</title>
</head>
<body style="background:#f9fafb;font-family:Inter,sans-serif;margin:0;padding:40px 0;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
    <h1 style="font-size:20px;font-weight:600;color:#111827;margin:0 0 20px;">New Feedback Received</h1>
    <p style="color:#374151;font-size:14px;line-height:24px;margin:0 0 8px;">
      <strong>From:</strong> ${email}
    </p>
    <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="color:#374151;font-size:14px;line-height:24px;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      &copy; ${new Date().getFullYear()} Dompetku by Treon Studio
    </p>
  </div>
</body>
</html>
  `.trim();
}
