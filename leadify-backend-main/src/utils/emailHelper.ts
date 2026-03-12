import nodemailer from 'nodemailer';
import settingService from '../setting/settingService';
import BaseError from './error/base-http-exception';
import { ERRORS } from './error/errors';

interface EmailAttachment {
  name: string;
  content: string; // base64 encoded
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachment?: EmailAttachment;
}

export async function sendEmail({ to, subject, text, html, attachment }: SendEmailOptions): Promise<void> {
  const setting = await settingService.getSetting();
  if (!setting?.emailApiKey) throw new BaseError(ERRORS.MISSING_EMAIL_CONFIGURATION);

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'app@hp-tech.com',
      pass: setting.emailApiKey
    }
  });

  await transporter.sendMail({
    from: '"HP Tech App" <app@hp-tech.com>',
    to,
    subject,
    text,
    html,
    attachments: attachment
      ? [{ filename: attachment.name, content: Buffer.from(attachment.content, 'base64') }]
      : undefined
  });
}
