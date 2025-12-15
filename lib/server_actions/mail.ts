'use server'
import nodemailer from 'nodemailer';
import { ServerActionsResponse } from '../types/Models';
import { APP_NAME } from '../app_config/config';

export async function sendMail({ email, invitationLink }: { email: string, invitationLink: string }): Promise<ServerActionsResponse> {
    if (!email) {
        console.log('Email can not be empty.');
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
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
            user: 'e7f239de8eb39d',
            pass: 'b69e0f25fb21f9',
        },
    });

    let data = null;
    let error = null;
    const messageBody = `Hi ${email.split('@')[0]},
        You are invited to complete your account at ${process.env.APP_URL} following this link: ${invitationLink}`;

    try {
        transporter.sendMail({
            from: process.env.GMAIL_USERNAME,
            to: email,
            subject: `New message from ${APP_NAME}`,
            text: messageBody,
            replyTo: 'kidane10g@gmail.com',
        });
        data = { success: true, message: 'Email sent successfully!' };
        console.error('mail sent');
    } catch (error) {
        console.error('mail errorerrorerrorerror');
        console.error(error);
        error = { success: false, message: 'Failed to send email.' };
    }

    return { data, error}
}