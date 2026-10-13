import { config } from '../config/env.js';

/**
 * Loosely coupled Email / Notification Service.
 * Formats password reset messages. In development/academic mode, it logs full
 * reset links to the console. Can be effortlessly connected to Nodemailer or SendGrid.
 */
class EmailService {
  /**
   * Send a password reset email/notification.
   * @param {object} params
   * @param {string} params.to
   * @param {string} params.name
   * @param {string} params.resetToken
   * @param {number} params.expiresInMinutes
   */
  async sendPasswordResetEmail({ to, name, resetToken, expiresInMinutes }) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    console.log('\n================== [EMAIL NOTIFICATION] ==================');
    console.log(`To: ${name} <${to}>`);
    console.log('Subject: RentRight - Reset Your Account Password');
    console.log('Content:');
    console.log(`Hello ${name},`);
    console.log('You requested to reset your password on RentRight.');
    console.log(`Your reset token is: ${resetToken}`);
    console.log(`Or visit this link to reset: ${resetUrl}`);
    console.log(`This link is valid for ${expiresInMinutes} minutes.`);
    console.log('If you did not request this, please ignore this email.');
    console.log('==========================================================\n');

    return {
      success: true,
      deliveredTo: to,
      resetUrl,
    };
  }
}

export const emailService = new EmailService();
