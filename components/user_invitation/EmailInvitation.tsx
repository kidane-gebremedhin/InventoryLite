import { APP_NAME } from "@/lib/app_config/config";

export function EmailInvitation({
	userName,
	inviteLink,
	expiryHours = 24,
}: {
	userName: string;
	inviteLink: string;
	expiryHours?: number;
}) {
	return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invitation to ${APP_NAME}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:40px;">
      <table width="100%" max-width="600px" align="center" style="background:#ffffff; padding:24px; border-radius:8px;">
        <tr>
          <td>
            <h2 style="color:#111827;">You're invited to join ${APP_NAME}</h2>
            <p>Hi ${userName},</p>

            <p>
              You’ve been invited to join <strong>${APP_NAME}</strong>.
            </p>

            <p style="margin:32px 0;">
              <a
                href="${inviteLink}"
                style="
                  background:#2563eb;
                  color:#ffffff;
                  padding:12px 20px;
                  text-decoration:none;
                  border-radius:6px;
                  display:inline-block;
                "
              >
                Accept Invitation
              </a>
            </p>

            <p style="color:#6b7280;">
              This invitation will expire in ${expiryHours} hours.
            </p>

            <p style="color:#6b7280;">
              If you did not expect this invitation, you can safely ignore this email.
            </p>

            <hr style="margin:24px 0;" />

            <p style="font-size:12px; color:#9ca3af;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
