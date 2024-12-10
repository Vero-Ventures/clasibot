'use server';

import nodemailer from 'nodemailer';
import { URLSearchParams } from 'url';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const messageContent: string = params.get('Body') ?? '';
    const authCode: string = params.get('AccountSid') ?? '';
    const senderNumber: string = params.get('From') ?? '';
    console.log('Endpoint Body Content');
    console.log(messageContent);
    console.log(authCode);
    console.log(senderNumber);

    if (!authCode || authCode !== process.env.MFA_FORWARDING_AUTH) {
      console.error(
        'Error Forwarding MFA: Missing Or Invalid Twilo Auth Code.'
      );
      return new Response('Missing Or Invalid Authorization', {
        status: 401,
      });
    }

    if (!senderNumber || senderNumber !== process.env.MFA_FORWARDING_NUMBER) {
      console.error('Endpoint called with non MFA Number.');
      return new Response('Non QBO MFA Number', {
        status: 401,
      });
    }

    if (!messageContent) {
      console.error('MFA Forwarding Content Not Found');
      return new Response('MFA Content Not Found', { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `Synthetic Authentication Code Forwarding`,
      text: `${messageContent}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return new Response('MFA Forwarded', { status: 200 });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error Sending MFA Forward Email: ' + error.message);
      } else {
        console.error('Unexpected Error Sending MFA Forward Email.');
      }
      return new Response('Error Forwarding Message', { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error Forwarding MFA: ' + error.message);
    } else {
      console.error('Unexpected Error Forwarding MFA.');
    }
    return new Response('Unexpected Error', { status: 400 });
  }
}
