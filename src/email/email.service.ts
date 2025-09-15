import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize Gmail SMTP transporter
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      this.logger.warn('GMAIL_USER or GMAIL_APP_PASSWORD not found in environment variables. Email functionality will be disabled.');
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('Gmail SMTP connection failed:', error);
        } else {
          this.logger.log('Gmail SMTP connection established successfully');
        }
      });
    }
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Gmail SMTP not configured - skipping email send');
      return;
    }

    const gmailUser = process.env.GMAIL_USER;
    const appName = process.env.APP_NAME || 'RoomieSync';
    const frontendUrl = process.env.FRONTEND_URL || 'roomiesync://';

    // Deep link URL for React Native app
    const resetUrl = `${frontendUrl}reset-password?token=${resetToken}`;

    // Fallback web URL if deep link doesn't work
    const webResetUrl = `${process.env.WEB_URL || 'https://app.roomiesync.com'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${appName} <${gmailUser}>`,
      to: to,
      subject: `Reset your ${appName} password`,
      html: this.getPasswordResetEmailTemplate(firstName, resetUrl, webResetUrl, appName),
      text: this.getPasswordResetEmailText(firstName, resetUrl, appName)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to} (Message ID: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  private getPasswordResetEmailTemplate(
    firstName: string,
    resetUrl: string,
    webResetUrl: string,
    appName: string
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                text-align: center;
                padding: 30px 20px;
                background-color: #10B981;
                color: white;
            }
            .logo {
                max-width: 80px;
                height: auto;
                margin-bottom: 10px;
            }
            .content {
                padding: 30px 30px 20px;
            }
            .button {
                display: inline-block;
                padding: 14px 32px;
                background-color: #10B981;
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                margin: 25px 0;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.2s;
            }
            .button:hover {
                background-color: #059669;
            }
            .footer {
                margin-top: 30px;
                padding: 20px 30px 30px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .security-notice {
                background-color: #FEF3C7;
                border-left: 4px solid #F59E0B;
                border-radius: 4px;
                padding: 16px;
                margin: 25px 0;
                font-size: 14px;
            }
            .alternative-link {
                font-size: 14px;
                color: #666;
                margin-top: 15px;
            }
            .alternative-link a {
                color: #10B981;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://res.cloudinary.com/dlfoeusi5/image/upload/v1757693041/roomiesync/houses/icon-nobg_st36cs" alt="${appName} Logo" class="logo">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${appName}</h1>
            </div>

            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>

                <p>Hi ${firstName},</p>

                <p>We received a request to reset your password for your ${appName} account. If you didn't make this request, you can safely ignore this email.</p>

                <p>To reset your password, tap the button below. This will open the ${appName} app:</p>

                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Password in App</a>
                </div>

                <div class="alternative-link">
                    <p>If the button above doesn't work, you can also
                    <a href="${webResetUrl}">reset your password on the web</a>.</p>
                </div>

                <div class="security-notice">
                    <strong>🔒 Security Notice:</strong> This link will expire in 15 minutes for your security.
                    If you need a new reset link, please request another password reset from the app.
                </div>

                <p>If you're having trouble or didn't request this reset, please contact our support team.</p>

                <p style="margin-bottom: 0;">Best regards,<br>The ${appName} Team</p>
            </div>

            <div class="footer">
                <p style="margin: 0 0 10px 0;">This email was sent because a password reset was requested for your ${appName} account.</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getPasswordResetEmailText(firstName: string, resetUrl: string, appName: string): string {
    return `
Hi ${firstName},

We received a request to reset your password for your ${appName} account.

To reset your password, please open this link in your mobile app:
${resetUrl}

This link will expire in 15 minutes for your security.

If you didn't request this password reset, you can safely ignore this email.

If you're having trouble, please contact our support team.

Best regards,
The ${appName} Team
    `.trim();
  }
}