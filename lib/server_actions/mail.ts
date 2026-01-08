"use server";
import nodemailer from "nodemailer";
import { APP_NAME, CONTACT_EMAIL } from "../app_config/config";
import { getCurrentDate } from "../helpers/Helper";
import type { ServerActionsResponse } from "../types/Models";

const transporter = () => {
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
	return nodemailer.createTransport({
		host: "sandbox.smtp.mailtrap.io",
		port: 2525,
		auth: {
			user: "e7f239de8eb39d",
			pass: "b69e0f25fb21f9",
		},
	});
};

export async function sendUserInvitationMail({
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

	let data = null;
	let error = null;
	const messageBody = emailInvitationTemplate({
		userName: email.split("@")[0],
		tenantName,
		invitationLink,
		invitationExpiresAt,
	});

	try {
		transporter().sendMail({
			from: process.env.GMAIL_USERNAME,
			to: email,
			subject: `New message from ${APP_NAME}`,
			html: messageBody,
			replyTo: CONTACT_EMAIL,
		});
		data = { success: true, message: "Email sent successfully!" };
		console.error("mail sent");
	} catch (_error) {
		console.error("mail error", error);
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
              © ${getCurrentDate()} ${APP_NAME}. All rights reserved| Contact us ${CONTACT_EMAIL}
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

export async function sendUpcomingPaymentDueNotificationMail({
	email,
	tenantName,
	paymentAmount,
	currencyType,
	dueDate,
}: {
	email: string;
	tenantName: string;
	paymentAmount: string;
	currencyType: string;
	dueDate: string;
}): Promise<ServerActionsResponse> {
	if (!email || !tenantName || !paymentAmount || !currencyType || !dueDate) {
		console.log("Failed to send an email due to missing details.");
		return null;
	}

	let data = null;
	let error = null;
	const messageBody = emailUpcomingPaymentDueTemplate({
		email,
		tenantName,
		paymentAmount,
		currencyType,
		dueDate,
	});

	try {
		transporter().sendMail({
			from: process.env.GMAIL_USERNAME,
			to: email,
			subject: `Upcoming payment notification`,
			html: messageBody,
			replyTo: process.env.NEXT_PUBLIC_APP_EMAIL,
		});
		data = {
			success: true,
			message: "Payment due notification email sent successfully!",
		};
		console.error("mail sent");
	} catch (_error) {
		console.error("mail error", error);
		error = {
			success: false,
			message: "Failed to send payment due notification email.",
		};
	}

	return { data, error };
}

function emailUpcomingPaymentDueTemplate({
	email,
	tenantName,
	paymentAmount,
	currencyType,
	dueDate,
}: {
	email: string;
	tenantName: string;
	paymentAmount: string;
	currencyType: string;
	dueDate: string;
}) {
  console.log('remove this', email,
	tenantName,
	paymentAmount,
	currencyType,
	dueDate
)
	return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${APP_NAME}(${tenantName}) Upcoming payment due reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:40px;">
      <table width="100%" max-width="600px" align="center" style="background:#ffffff; padding:24px; border-radius:8px;">
        <tr>
          <td>
            <h2 style="color:#111827;">${APP_NAME}(${tenantName}) Upcoming payment due reminder</h2>
            <p>Hello ${tenantName},</p>

            <p style="margin:32px 0;">
              Your current subscription will be expired at ${dueDate}. Please follow the link below to make payment and keep your service active. 

              ${process.env.APP_URL}/dashboard/manual-payment
            </p>

            <hr style="margin:24px 0;" />

            <p style="font-size:12px; color:#9ca3af;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved| Contact us ${CONTACT_EMAIL}
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
