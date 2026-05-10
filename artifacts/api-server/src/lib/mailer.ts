import { logger } from "./logger.js";

interface ResetEmailOptions {
  to: string;
  fullName: string;
  resetUrl: string;
}

export interface MembershipDecisionEmailOptions {
  to: string;
  fullName: string;
  clubName: string;
  clubSlug: string;
  decision: "approved" | "rejected";
  portalBaseUrl?: string;
}

export interface EventDecisionEmailOptions {
  to: string;
  fullName: string;
  eventTitle: string;
  clubName: string;
  clubSlug: string;
  decision: "approved" | "rejected";
  portalBaseUrl?: string;
}

export interface NoticeDecisionEmailOptions {
  to: string;
  fullName: string;
  noticeTitle: string;
  clubName: string;
  clubSlug: string;
  decision: "approved" | "rejected";
  portalBaseUrl?: string;
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

function buildMembershipDecisionHtml(
  fullName: string,
  clubName: string,
  decision: "approved" | "rejected",
  clubUrl: string,
): string {
  const isApproved = decision === "approved";
  const accentColor = isApproved ? "#16a34a" : "#dc2626";
  const headerGradient = isApproved
    ? "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)"
    : "linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #ef4444 100%)";
  const statusBadgeBg = isApproved ? "#dcfce7" : "#fee2e2";
  const statusBadgeBorder = isApproved ? "#bbf7d0" : "#fecaca";
  const statusBadgeColor = isApproved ? "#166534" : "#991b1b";
  const statusIcon = isApproved ? "✅" : "❌";
  const statusLabel = isApproved ? "Approved" : "Not Approved";
  const bodyText = isApproved
    ? `Congratulations! Your membership request for <strong>${clubName}</strong> has been <strong>approved</strong>. You are now an official member and can participate in all club activities, events, and discussions.`
    : `Thank you for your interest in <strong>${clubName}</strong>. Unfortunately, your membership request has not been approved at this time. You are welcome to apply again in the future.`;
  const buttonText = isApproved ? "View Club Page" : "Explore Other Clubs";
  const buttonUrl = isApproved ? clubUrl : "/";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Membership ${statusLabel} — ${clubName}</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f2f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: ${headerGradient}; padding: 40px 32px 32px; text-align: center; }
    .logo { display: inline-block; width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 14px; line-height: 52px; text-align: center; color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.80); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; color: #1e1b4b; font-weight: 600; margin-bottom: 16px; }
    .status-badge { display: inline-block; background: ${statusBadgeBg}; border: 1px solid ${statusBadgeBorder}; color: ${statusBadgeColor}; border-radius: 9999px; padding: 6px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 28px; }
    .club-name-box { background: #f3f4f6; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 12px 16px; font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 24px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: ${accentColor}; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">MU</div>
      <h1>Membership Update</h1>
      <p>Metropolitan University Club Portal</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${fullName}!</p>
      <div class="status-badge">${statusIcon} ${statusLabel}</div>
      <div class="club-name-box">${clubName}</div>
      <p class="text">${bodyText}</p>
      <div class="btn-wrap">
        <a href="${buttonUrl}" class="btn">${buttonText}</a>
      </div>
      <hr class="divider" />
      <p class="text" style="margin-bottom:0; font-size:13px; color:#6b7280;">
        This is an automated message from the MU Club Portal. Please do not reply to this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEventDecisionHtml(
  fullName: string,
  eventTitle: string,
  clubName: string,
  decision: "approved" | "rejected",
  clubUrl: string,
): string {
  const isApproved = decision === "approved";
  const accentColor = isApproved ? "#16a34a" : "#dc2626";
  const headerGradient = isApproved
    ? "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)"
    : "linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #ef4444 100%)";
  const statusBadgeBg = isApproved ? "#dcfce7" : "#fee2e2";
  const statusBadgeBorder = isApproved ? "#bbf7d0" : "#fecaca";
  const statusBadgeColor = isApproved ? "#166534" : "#991b1b";
  const statusIcon = isApproved ? "✅" : "❌";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const bodyText = isApproved
    ? `Great news! Your event <strong>"${eventTitle}"</strong> for <strong>${clubName}</strong> has been <strong>approved</strong> by the Overseer and is now live on the portal. Students can see it and RSVP.`
    : `Your event <strong>"${eventTitle}"</strong> for <strong>${clubName}</strong> has been <strong>rejected</strong> by the Overseer. You may edit and resubmit a revised version from your Club Admin dashboard.`;
  const buttonText = isApproved ? "View Club Events" : "Go to Dashboard";
  const buttonUrl = isApproved ? clubUrl : "/dashboard";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event ${statusLabel} — ${eventTitle}</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f2f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: ${headerGradient}; padding: 40px 32px 32px; text-align: center; }
    .logo { display: inline-block; width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 14px; line-height: 52px; text-align: center; color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.80); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; color: #1e1b4b; font-weight: 600; margin-bottom: 16px; }
    .status-badge { display: inline-block; background: ${statusBadgeBg}; border: 1px solid ${statusBadgeBorder}; color: ${statusBadgeColor}; border-radius: 9999px; padding: 6px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 28px; }
    .item-box { background: #f3f4f6; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .item-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .item-box .value { font-size: 15px; font-weight: 700; color: #111827; }
    .item-box .sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: ${accentColor}; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">MU</div>
      <h1>Event ${statusLabel}</h1>
      <p>Metropolitan University Club Portal</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${fullName}!</p>
      <div class="status-badge">${statusIcon} ${statusLabel}</div>
      <div class="item-box">
        <div class="label">Event</div>
        <div class="value">${eventTitle}</div>
        <div class="sub">${clubName}</div>
      </div>
      <p class="text">${bodyText}</p>
      <div class="btn-wrap">
        <a href="${buttonUrl}" class="btn">${buttonText}</a>
      </div>
      <hr class="divider" />
      <p class="text" style="margin-bottom:0; font-size:13px; color:#6b7280;">
        This is an automated message from the MU Club Portal. Please do not reply to this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildNoticeDecisionHtml(
  fullName: string,
  noticeTitle: string,
  clubName: string,
  decision: "approved" | "rejected",
  clubUrl: string,
): string {
  const isApproved = decision === "approved";
  const accentColor = isApproved ? "#16a34a" : "#dc2626";
  const headerGradient = isApproved
    ? "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)"
    : "linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #ef4444 100%)";
  const statusBadgeBg = isApproved ? "#dcfce7" : "#fee2e2";
  const statusBadgeBorder = isApproved ? "#bbf7d0" : "#fecaca";
  const statusBadgeColor = isApproved ? "#166534" : "#991b1b";
  const statusIcon = isApproved ? "✅" : "❌";
  const statusLabel = isApproved ? "Approved" : "Rejected";
  const bodyText = isApproved
    ? `Your notice <strong>"${noticeTitle}"</strong> for <strong>${clubName}</strong> has been <strong>approved</strong> by the Overseer and is now visible to club members and visitors on the portal.`
    : `Your notice <strong>"${noticeTitle}"</strong> for <strong>${clubName}</strong> has been <strong>rejected</strong> by the Overseer. You may revise and resubmit it from your Club Admin dashboard.`;
  const buttonText = isApproved ? "View Club Notices" : "Go to Dashboard";
  const buttonUrl = isApproved ? clubUrl : "/dashboard";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notice ${statusLabel} — ${noticeTitle}</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f2f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: ${headerGradient}; padding: 40px 32px 32px; text-align: center; }
    .logo { display: inline-block; width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 14px; line-height: 52px; text-align: center; color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.80); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; color: #1e1b4b; font-weight: 600; margin-bottom: 16px; }
    .status-badge { display: inline-block; background: ${statusBadgeBg}; border: 1px solid ${statusBadgeBorder}; color: ${statusBadgeColor}; border-radius: 9999px; padding: 6px 18px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 28px; }
    .item-box { background: #f3f4f6; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .item-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .item-box .value { font-size: 15px; font-weight: 700; color: #111827; }
    .item-box .sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: ${accentColor}; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">MU</div>
      <h1>Notice ${statusLabel}</h1>
      <p>Metropolitan University Club Portal</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${fullName}!</p>
      <div class="status-badge">${statusIcon} ${statusLabel}</div>
      <div class="item-box">
        <div class="label">Notice</div>
        <div class="value">${noticeTitle}</div>
        <div class="sub">${clubName}</div>
      </div>
      <p class="text">${bodyText}</p>
      <div class="btn-wrap">
        <a href="${buttonUrl}" class="btn">${buttonText}</a>
      </div>
      <hr class="divider" />
      <p class="text" style="margin-bottom:0; font-size:13px; color:#6b7280;">
        This is an automated message from the MU Club Portal. Please do not reply to this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

async function createTransporter() {
  const nodemailer = await import("nodemailer");

  const emailService = process.env["EMAIL_SERVICE"];
  const emailUser = process.env["EMAIL_USER"];
  const emailPass = process.env["EMAIL_PASS"];

  if (emailService && emailUser && emailPass) {
    return {
      transporter: nodemailer.default.createTransport({
        service: emailService,
        auth: { user: emailUser, pass: emailPass },
      }),
      fromAddress: `"MU Club Portal" <${emailUser}>`,
    };
  }

  const smtpHost = process.env["SMTP_HOST"];
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  const smtpFrom = process.env["SMTP_FROM"] || smtpUser || "noreply@mu.edu";

  if (smtpHost && smtpUser && smtpPass) {
    return {
      transporter: nodemailer.default.createTransport({
        host: smtpHost,
        port: Number(process.env["SMTP_PORT"] || "587"),
        secure: process.env["SMTP_SECURE"] === "true",
        auth: { user: smtpUser, pass: smtpPass },
      }),
      fromAddress: `"MU Club Portal" <${smtpFrom}>`,
    };
  }

  return null;
}

export async function sendPasswordResetEmail(opts: ResetEmailOptions): Promise<void> {
  const transport = await createTransporter();

  if (!transport) {
    logger.warn(
      "Email not configured — password reset email skipped. Set EMAIL_SERVICE + EMAIL_USER + EMAIL_PASS (or SMTP_HOST + SMTP_USER + SMTP_PASS) to enable.",
    );
    return;
  }

  const { transporter, fromAddress } = transport;

  await transporter.sendMail({
    from: fromAddress,
    to: opts.to,
    subject: "Reset your MU Portal password",
    html: buildResetHtml(opts.fullName, opts.resetUrl),
    text: `Hello ${opts.fullName},\n\nReset your password here (expires in 1 hour):\n${opts.resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });

  logger.info({ to: opts.to }, "Password reset email sent");
}

export async function sendEventDecisionEmail(
  opts: EventDecisionEmailOptions,
): Promise<void> {
  const transport = await createTransporter();

  if (!transport) {
    logger.warn(
      { to: opts.to, eventTitle: opts.eventTitle, decision: opts.decision },
      "Email not configured — event decision email skipped.",
    );
    return;
  }

  const { transporter, fromAddress } = transport;

  const baseUrl = opts.portalBaseUrl ?? process.env["PORTAL_BASE_URL"] ?? "";
  const clubUrl = `${baseUrl}/clubs/${opts.clubSlug}`;
  const subject =
    opts.decision === "approved"
      ? `Event Approved: "${opts.eventTitle}" is now live`
      : `Event Update: "${opts.eventTitle}" was not approved`;

  await transporter.sendMail({
    from: fromAddress,
    to: opts.to,
    subject,
    html: buildEventDecisionHtml(opts.fullName, opts.eventTitle, opts.clubName, opts.decision, clubUrl),
    text:
      opts.decision === "approved"
        ? `Hello ${opts.fullName},\n\nYour event "${opts.eventTitle}" for ${opts.clubName} has been approved and is now live on the MU Club Portal.`
        : `Hello ${opts.fullName},\n\nYour event "${opts.eventTitle}" for ${opts.clubName} was rejected by the Overseer. You may revise and resubmit from your dashboard.`,
  });

  logger.info({ to: opts.to, eventTitle: opts.eventTitle, decision: opts.decision }, "Event decision email sent");
}

export async function sendNoticeDecisionEmail(
  opts: NoticeDecisionEmailOptions,
): Promise<void> {
  const transport = await createTransporter();

  if (!transport) {
    logger.warn(
      { to: opts.to, noticeTitle: opts.noticeTitle, decision: opts.decision },
      "Email not configured — notice decision email skipped.",
    );
    return;
  }

  const { transporter, fromAddress } = transport;

  const baseUrl = opts.portalBaseUrl ?? process.env["PORTAL_BASE_URL"] ?? "";
  const clubUrl = `${baseUrl}/clubs/${opts.clubSlug}`;
  const subject =
    opts.decision === "approved"
      ? `Notice Approved: "${opts.noticeTitle}" is now live`
      : `Notice Update: "${opts.noticeTitle}" was not approved`;

  await transporter.sendMail({
    from: fromAddress,
    to: opts.to,
    subject,
    html: buildNoticeDecisionHtml(opts.fullName, opts.noticeTitle, opts.clubName, opts.decision, clubUrl),
    text:
      opts.decision === "approved"
        ? `Hello ${opts.fullName},\n\nYour notice "${opts.noticeTitle}" for ${opts.clubName} has been approved and is now visible on the MU Club Portal.`
        : `Hello ${opts.fullName},\n\nYour notice "${opts.noticeTitle}" for ${opts.clubName} was rejected by the Overseer. You may revise and resubmit from your dashboard.`,
  });

  logger.info({ to: opts.to, noticeTitle: opts.noticeTitle, decision: opts.decision }, "Notice decision email sent");
}

export interface JoinRequestAdminEmailOptions {
  to: string;
  adminFullName: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantDepartment?: string | null;
  applicantStudentId?: string | null;
  clubName: string;
  clubSlug: string;
  message?: string | null;
  portalBaseUrl?: string;
}

function buildJoinRequestAdminHtml(
  adminFullName: string,
  applicantFullName: string,
  applicantEmail: string,
  applicantDepartment: string | null,
  applicantStudentId: string | null,
  clubName: string,
  clubUrl: string,
  message: string | null,
): string {
  const rows = [
    { label: "Name", value: applicantFullName },
    { label: "Email", value: applicantEmail },
    ...(applicantDepartment ? [{ label: "Department", value: applicantDepartment }] : []),
    ...(applicantStudentId ? [{ label: "Student ID", value: applicantStudentId }] : []),
  ];

  const rowsHtml = rows
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#6b7280;white-space:nowrap;border-bottom:1px solid #f3f4f6;">${r.label}</td>
          <td style="padding:8px 12px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${r.value}</td>
        </tr>`,
    )
    .join("");

  const messageSection = message
    ? `<div style="background:#f3f4f6;border-left:4px solid #4f46e5;border-radius:8px;padding:12px 16px;margin:20px 0;font-size:13px;color:#374151;line-height:1.6;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;margin-bottom:6px;">Message from applicant</div>
        ${message}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Membership Request — ${clubName}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:540px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(67,56,202,0.10);">
    <div style="background:linear-gradient(135deg,#3730a3 0%,#4f46e5 50%,#6366f1 100%);padding:40px 32px 32px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;line-height:52px;text-align:center;color:white;font-weight:800;font-size:18px;letter-spacing:1px;margin-bottom:16px;">MU</div>
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">New Membership Request</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${clubName} · Metropolitan University Club Portal</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="font-size:16px;color:#1e1b4b;font-weight:600;margin-bottom:12px;">Hello, ${adminFullName}!</p>
      <p style="font-size:14px;color:#4b5563;line-height:1.7;margin-bottom:24px;">
        A student has submitted a membership request to join <strong>${clubName}</strong>. Review the details below and approve or reject from your Club Admin dashboard.
      </p>
      <div style="background:#f9fafb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${rowsHtml}
        </table>
      </div>
      ${messageSection}
      <div style="text-align:center;margin:28px 0;">
        <a href="${clubUrl}" style="display:inline-block;background:linear-gradient(135deg,#3730a3,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 6px 20px rgba(67,56,202,0.35);">
          Review Request
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0;">
        This is an automated notification from the MU Club Portal. Please do not reply to this email.
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendJoinRequestAdminEmail(
  opts: JoinRequestAdminEmailOptions,
): Promise<void> {
  const transport = await createTransporter();

  if (!transport) {
    logger.warn(
      { to: opts.to, clubName: opts.clubName },
      "Email not configured — join request admin email skipped.",
    );
    return;
  }

  const { transporter, fromAddress } = transport;

  const baseUrl = opts.portalBaseUrl ?? process.env["PORTAL_BASE_URL"] ?? "";
  const clubUrl = `${baseUrl}/clubs/${opts.clubSlug}`;

  await transporter.sendMail({
    from: fromAddress,
    to: opts.to,
    subject: `New membership request for ${opts.clubName} from ${opts.applicantFullName}`,
    html: buildJoinRequestAdminHtml(
      opts.adminFullName,
      opts.applicantFullName,
      opts.applicantEmail,
      opts.applicantDepartment ?? null,
      opts.applicantStudentId ?? null,
      opts.clubName,
      clubUrl,
      opts.message ?? null,
    ),
    text: `Hello ${opts.adminFullName},\n\n${opts.applicantFullName} (${opts.applicantEmail}) has requested to join ${opts.clubName}.\n\nReview the request here:\n${clubUrl}`,
  });

  logger.info({ to: opts.to, clubName: opts.clubName, applicant: opts.applicantFullName }, "Join request admin email sent");
}

export async function sendMembershipDecisionEmail(
  opts: MembershipDecisionEmailOptions,
): Promise<void> {
  const transport = await createTransporter();

  if (!transport) {
    logger.warn(
      { to: opts.to, clubName: opts.clubName, decision: opts.decision },
      "Email not configured — membership decision email skipped.",
    );
    return;
  }

  const { transporter, fromAddress } = transport;

  const baseUrl = opts.portalBaseUrl ?? process.env["PORTAL_BASE_URL"] ?? "";
  const clubUrl = `${baseUrl}/clubs/${opts.clubSlug}`;
  const subject =
    opts.decision === "approved"
      ? `Welcome to ${opts.clubName} — Membership Approved!`
      : `Your membership request for ${opts.clubName}`;

  await transporter.sendMail({
    from: fromAddress,
    to: opts.to,
    subject,
    html: buildMembershipDecisionHtml(opts.fullName, opts.clubName, opts.decision, clubUrl),
    text:
      opts.decision === "approved"
        ? `Hello ${opts.fullName},\n\nCongratulations! Your membership request for ${opts.clubName} has been approved. Visit the club page here:\n${clubUrl}`
        : `Hello ${opts.fullName},\n\nThank you for your interest in ${opts.clubName}. Unfortunately, your membership request has not been approved at this time. You are welcome to apply again in the future.`,
  });

  logger.info({ to: opts.to, clubName: opts.clubName, decision: opts.decision }, "Membership decision email sent");
}
