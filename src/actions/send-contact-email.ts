'use server';

import nodemailer from 'nodemailer';

// Takes: The user Email address, Email subject, and Email body.
// Returns: A message object containing a success or error result message.
export async function sendContactEmail({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}): Promise<{ message: string }> {
  try {
    // Create a new Nodemailer Transporter to send the Email.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      // Auth defines the username and password of the host Email.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Define the Email elements; The sender, the receiver, the subject, and the body.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `New Contact Form Submission from: ${email}`,
      text: `Subject: ${subject}\n\nBody:\n${body}`,
    };

    try {
      // Send the Email through the Transporter using the mail options.
      await transporter.sendMail(mailOptions);
      // Return a success message.
      return { message: 'success' };
    } catch (error) {
      // Catch and log any errors from sending the Email, then return an error message.
      console.error('Error Sending Email:', error);
      return { message: 'error' };
    }
  } catch (error) {
    // Catch and log any errors creating the Transporter, then return an error message.
    console.error('Error Creating Transporter:', error);
    return { message: 'error' };
  }
}
