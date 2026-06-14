import { Resend } from 'resend';
import logger from './logger.js';

// Initialize the API client
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email, name, rollNumber, password) => {
  try {
    const data = await resend.emails.send({
      from: 'Virtual Classroom <onboarding@resend.dev>', // You must use this specific email on the free tier!
      to: email, 
      subject: 'Welcome to Virtual Classroom - Your Login Credentials',
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>An administrator has created your Virtual Classroom account.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Login ID (Roll Number):</strong> ${rollNumber}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>Please log in and change your password immediately.</p>
      `,
    });

    logger.info(`Welcome email sent to ${email} via Resend API`);
    return data;
  } catch (error) {
    logger.error(`Resend API Error: ${error.message}`);
    throw error;
  }
};