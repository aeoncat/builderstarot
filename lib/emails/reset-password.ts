type ResetPasswordEmailInput = {
  url: string;
  userName?: string | null;
};

/**
 * Builds the subject, plain-text, and HTML for the password-reset email.
 * Kept free of secrets so it is safe to unit-test and log the body in dev.
 */
export function buildResetPasswordEmail({ url, userName }: ResetPasswordEmailInput) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  const subject = "Reset your Builder's Tarot password";

  const text = [
    greeting,
    "",
    "We received a request to reset your Builder's Tarot password.",
    "Open the link below to choose a new one. It expires in 1 hour.",
    "",
    url,
    "",
    "If you didn't request this, you can safely ignore this email — your password won't change.",
    "",
    "— Builder's Tarot",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0d0b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b14;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#151221;border:1px solid #2a2440;border-radius:16px;padding:32px;">
            <tr>
              <td style="color:#d0a657;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;padding-bottom:8px;">Builder's Tarot</td>
            </tr>
            <tr>
              <td style="color:#f1eee7;font-size:22px;font-weight:800;padding-bottom:16px;">Reset your password</td>
            </tr>
            <tr>
              <td style="color:#c9c4d4;font-size:15px;line-height:1.6;padding-bottom:24px;">
                ${greeting}<br /><br />
                We received a request to reset your password. Choose a new one using the button below. This link expires in 1 hour.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${url}" style="display:inline-block;background:#d0a657;color:#1a1626;font-weight:700;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:10px;">Reset password</a>
              </td>
            </tr>
            <tr>
              <td style="color:#8a8499;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${url}" style="color:#d0a657;word-break:break-all;">${url}</a>
              </td>
            </tr>
            <tr>
              <td style="color:#6c6780;font-size:12px;line-height:1.6;padding-top:24px;border-top:1px solid #2a2440;margin-top:24px;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
