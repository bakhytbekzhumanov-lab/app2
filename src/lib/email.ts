import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Life RPG <onboarding@resend.dev>",
    to: email,
    subject: "Verify your Life RPG account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #4ade80; text-align: center; font-size: 28px;">Life RPG</h1>
        <h2 style="text-align: center; color: #333;">Verify your email</h2>
        <p style="text-align: center; color: #666; line-height: 1.6;">
          Click the button below to verify your email and start leveling up your life!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #4ade80; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
