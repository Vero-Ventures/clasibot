'use server';

import nodemailer from 'nodemailer';
import { URLSearchParams } from 'url';

export async function POST(request: Request) {
  try {
    // Decode the body as text and read it with URL Search Params.
    const body = await request.text();
    const params = new URLSearchParams(body);

    // Extract the SMS message content, account SID, and sender number.
    const messageContent: string = params.get('Body') ?? '';
    const accountSID: string = params.get('AccountSid') ?? '';
    const senderNumber: string = params.get('From') ?? '';

    // Check if the account SID is missing or does not match the expected value.
    if (!accountSID || accountSID !== process.env.MFA_FORWARDING_AUTH) {
      // Log an error and return an error response.
      console.error(
        'Error Forwarding MFA: Missing Or Invalid Twilo Auth Code.'
      );
      return new Response('Missing Or Invalid Authorization', {
        status: 401,
      });
    }

    // Check if the sender number is missing not match the expected value.
    if (!senderNumber || senderNumber !== process.env.MFA_FORWARDING_NUMBER) {
      // Log an error and return an error response.
      console.error('Endpoint called with non MFA Number.');
      return new Response('Non QBO MFA Number', {
        status: 401,
      });
    }

    // Check if the message content is missing.
    if (!messageContent) {
      // Log an error and return an error response.
      console.error('MFA Forwarding Content Not Found');
      return new Response('MFA Content Not Found', { status: 400 });
    }

    // Create a nodemailer transporter using the spacemail account.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Define an email to be sent to the spacemail mailbox containing the SMS message content.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `Synthetic Authentication Code Forwarding`,
      text: `${messageContent}`,
    };

    // Try sending the email and return a success response on result.
    try {
      await transporter.sendMail(mailOptions);
      return new Response('MFA Forwarded', { status: 200 });
    } catch (error) {
      // If an error was caught sending the email, log an error and return an error response.
      if (error instanceof Error) {
        console.error('Error Sending MFA Forward Email: ' + error.message);
      } else {
        console.error('Unexpected Error Sending MFA Forward Email.');
      }
      return new Response('Error Forwarding Message', { status: 400 });
    }
  } catch (error) {
    // If an error is caught, log an error and return an error response.
    if (error instanceof Error) {
      console.error('Error Forwarding MFA: ' + error.message);
    } else {
      console.error('Unexpected Error Forwarding MFA.');
    }
    return new Response('Unexpected Error', { status: 400 });
  }
}
