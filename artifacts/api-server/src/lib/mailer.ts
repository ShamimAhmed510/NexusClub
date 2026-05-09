import { logger } from "./logger.js";

interface ResetEmailOptions {
  to: string;
  fullName: string;
  resetUrl: string;
}

function buildResetHtml(fullName: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f2f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(67,56,202,0.10); }
    .header { background: linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%); padding: 40px 32px 32px; text-align: center; }
    .logo { display: inline-block; width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 14px; line-height: 52px; text-align: center; color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.75); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; color: #1e1b4b; font-weight: 600; margin-bottom: 12px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 28px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #3730a3, #4f46e5); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(67,56,202,0.35); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .link-text { font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; }
    .expiry { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 16px; font-size: 13px; color: #92400e; margin-bottom: 24px; text-align: center; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">MU</div>
      <h1>Password Reset</h1>
      <p>Metropolitan University Club Portal</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${fullName}!</p>
      <p class="text">
        We received a request to reset the password for your MU Portal account.
        Click the button below to choose a new password.
      </p>
      <div class="expiry">⏰ This link expires in <strong>1 hour</strong></div>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <hr class="divider" />
      <p class="link-text">
        If the button doesn't work, copy and paste this URL into your browser:<br />
        ${resetUrl}
      </p>
      <hr class="divider" />
      <p class="text" style="margin-bottom:0; font-size:13px; color:#6b7280;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPasswordResetEmail(opts: ResetEmailOptions): Promise<void> {
  const smtpHost = process.env["SMTP_HOST"];
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  const fromEmail = process.env["SMTP_FROM"] || smtpUser || "noreply@mu.edu";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn("SMTP not configured — password reset email skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.");
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env["SMTP_PORT"] || "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"MU Club Portal" <${fromEmail}>`,
    to: opts.to,
    subject: "Reset your MU Portal password",
    html: buildResetHtml(opts.fullName, opts.resetUrl),
    text: `Hello ${opts.fullName},\n\nReset your password here (expires in 1 hour):\n${opts.resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });

  logger.info({ to: opts.to }, "Password reset email sent");
}
