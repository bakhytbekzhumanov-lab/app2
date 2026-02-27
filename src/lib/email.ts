import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping verification email");
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Life RPG <onboarding@resend.dev>",
    to: email,
    subject: "Подтвердите ваш аккаунт Life RPG",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0a0a12; color: #e8e6e3;">
        <h1 style="color: #4ade80; text-align: center; font-size: 28px; margin-bottom: 8px;">Life RPG</h1>
        <p style="text-align: center; color: #888; font-size: 14px; margin-bottom: 32px;">Level up your life</p>
        <div style="background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px; text-align: center;">
          <h2 style="color: #e8e6e3; font-size: 20px; margin-bottom: 12px;">Подтвердите вашу почту</h2>
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Нажмите кнопку ниже, чтобы подтвердить email и начать прокачивать свою жизнь!
          </p>
          <a href="${verifyUrl}" style="background: #4ade80; color: #000; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Подтвердить Email
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            Ссылка действительна 24 часа. Если вы не создавали аккаунт, проигнорируйте это письмо.
          </p>
        </div>
      </div>
    `,
  });
}
