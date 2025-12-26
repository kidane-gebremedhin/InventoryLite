"use server";
import nodemailer from "nodemailer";
import { APP_NAME } from "../app_config/config";
import type { ServerActionsResponse } from "../types/Models";

export async function sendMail({
	email,
	tenantName,
	invitationLink,
	invitationExpiresAt,
}: {
	email: string;
	tenantName: string;
	invitationLink: string;
	invitationExpiresAt: string;
}): Promise<ServerActionsResponse> {
	if (!email) {
		console.log("Email can not be empty.");
		return null;
	}
	/*
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
        },
    })
    */
	const transporter = nodemailer.createTransport({
		host: "sandbox.smtp.mailtrap.io",
		port: 2525,
		auth: {
			user: "e7f239de8eb39d",
			pass: "b69e0f25fb21f9",
		},
	});

	let data = null;
	let error = null;
	const messageBody = emailInvitationTemplate({
		userName: email.split("@")[0],
		tenantName,
		invitationLink,
		invitationExpiresAt,
	});
	// `Hi ${email.split('@')[0]},
	//     You are invited to complete your account at ${process.env.APP_URL} following this link: ${invitationLink}`;

	try {
		transporter.sendMail({
			from: process.env.GMAIL_USERNAME,
			to: email,
			subject: `New message from ${APP_NAME}`,
			html: messageBody,
			replyTo: "kidane10g@gmail.com",
		});
		data = { success: true, message: "Email sent successfully!" };
		console.error("mail sent");
	} catch (_error) {
		console.error("mail errorerrorerrorerror", error);
		error = { success: false, message: "Failed to send email." };
	}

	return { data, error };
}

function emailInvitationTemplate({
	userName,
	tenantName,
	invitationLink,
	invitationExpiresAt,
}: {
	userName: string;
	tenantName: string;
	invitationLink: string;
	invitationExpiresAt?: string;
}) {
	return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invitation to ${APP_NAME}(${tenantName})</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:40px;">
      <table width="100%" max-width="600px" align="center" style="background:#ffffff; padding:24px; border-radius:8px;">
        <tr>
          <td>
            <h2 style="color:#111827;">You're invited to join ${APP_NAME}(${tenantName})</h2>
            <p>Hi ${userName},</p>

            <p>
              You’ve been invited to join <strong>${APP_NAME}(${tenantName})</strong>.
            </p>

            <p style="margin:32px 0;">
              <a
                href="${invitationLink}"
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
              This invitation will be expired at ${invitationExpiresAt}.
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
