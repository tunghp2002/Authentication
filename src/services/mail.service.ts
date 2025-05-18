// src/services/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.password');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://yourapp.com/reset-password?token=${token}`;
    const mailOptions = {
      from: `"Auth-backend service" <${this.configService.get<string>('mail.user')}>`,
      to,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('❌ Failed to send password reset email:', err);
      throw new Error('Could not send reset email');
    }
  }
}
