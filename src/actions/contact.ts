/**
 * Defines an action to send an email to the contact email using the 'Contact Us' form information.
 * Returns a success message if the email is sent successfully, otherwise returns an error message.
 */
'use server';
import nodemailer from 'nodemailer';

// Takes an email, subject, and body string.
export async function contactAction({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}): Promise<{ message: string }> {
  try {
    // Create a new nodemailer transporter with the email server details.
    // The host email name, port to use, the secure status of the port.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      // Auth defines the username and password of the host email.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Define the email options; The sender, the receiver, the subject, and the body.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `New Contact Form Submission from ${email}`,
      text: `Subject: ${subject}\n\nBody:\n${body}`,
    };

    try {
      // Send the email using the transporter using the mail options.
      await transporter.sendMail(mailOptions);
      // Return a success message.
      return { message: 'success' };
    } catch (error) {
      // Log any errors and return an error message.
      console.error('Error sending email:', error);
      return { message: 'error' };
    }
  } catch (error) {
    // Log any errors and return an error message.
    console.error('Error sending email:', error);
    return { message: 'error' };
  }
}
