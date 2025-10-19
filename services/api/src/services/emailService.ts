import nodemailer from 'nodemailer';
import { User, Seller } from '@partpal/shared-types';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface WelcomeEmailData {
  user: User;
  verificationUrl?: string;
}

export interface SellerVerificationEmailData {
  seller: Seller;
  user: User;
  adminUrl: string;
}

export interface PasswordResetEmailData {
  user: User;
  resetUrl: string;
  expiresIn: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private fromEmail = '';

  constructor() {
    this.configure();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private configure(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@partpal.co.za';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('Email configuration missing. Email services will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.isConfigured = true;
    console.log('Email service configured successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured - email not sent');
      return false;
    }

    try {
      const mailOptions = {
        from: `"PartPal" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { user, verificationUrl } = data;
    const template = this.generateWelcomeEmailTemplate(user, verificationUrl);

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendEmailVerification(user: User, verificationUrl: string): Promise<boolean> {
    const template = this.generateEmailVerificationTemplate(user, verificationUrl);

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const template = this.generatePasswordResetTemplate(data);

    return this.sendEmail({
      to: data.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSellerVerificationNotification(data: SellerVerificationEmailData): Promise<boolean> {
    const template = this.generateSellerVerificationTemplate(data);

    // Send to admin for review
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@partpal.co.za';

    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSellerApprovalEmail(seller: Seller, user: User): Promise<boolean> {
    const template = this.generateSellerApprovalTemplate(seller, user);

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSellerRejectionEmail(seller: Seller, user: User, reason?: string): Promise<boolean> {
    const template = this.generateSellerRejectionTemplate(seller, user, reason);

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private generateWelcomeEmailTemplate(user: User, verificationUrl?: string): EmailTemplate {
    const subject = 'Welcome to PartPal - Your Auto Parts Marketplace';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PartPal</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Welcome to PartPal, South Africa's premier auto parts marketplace!</p>
            <p>Your account has been created successfully with the role: <strong>${user.role}</strong></p>

            ${verificationUrl ? `
              <p>To get started, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p><small>If the button doesn't work, copy and paste this link: ${verificationUrl}</small></p>
            ` : ''}

            <h3>What's Next?</h3>
            <ul>
              <li><strong>Buyers:</strong> Search for quality auto parts from verified sellers</li>
              <li><strong>Sellers:</strong> Complete your business profile to start selling</li>
              <li><strong>Admins:</strong> Access the admin dashboard to manage the platform</li>
            </ul>

            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The PartPal Team</p>
          </div>
          <div class="footer">
            <p>PartPal - Connecting South Africa's Auto Parts Industry</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to PartPal!

      Hello ${user.name},

      Welcome to PartPal, South Africa's premier auto parts marketplace!
      Your account has been created successfully with the role: ${user.role}

      ${verificationUrl ? `To get started, please verify your email address: ${verificationUrl}` : ''}

      What's Next?
      - Buyers: Search for quality auto parts from verified sellers
      - Sellers: Complete your business profile to start selling
      - Admins: Access the admin dashboard to manage the platform

      If you have any questions, please contact our support team.

      Best regards,
      The PartPal Team
    `;

    return { subject, html, text };
  }

  private generateEmailVerificationTemplate(user: User, verificationUrl: string): EmailTemplate {
    const subject = 'PartPal - Verify Your Email Address';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Please verify your email address to complete your PartPal account setup.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p><small>If the button doesn't work, copy and paste this link: ${verificationUrl}</small></p>
            <p>This verification link will expire in 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Email Verification - PartPal

      Hello ${user.name},

      Please verify your email address: ${verificationUrl}

      This link will expire in 24 hours.
    `;

    return { subject, html, text };
  }

  private generatePasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
    const { user, resetUrl, expiresIn } = data;
    const subject = 'PartPal - Password Reset Request';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>We received a request to reset your PartPal password.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p><small>If the button doesn't work, copy and paste this link: ${resetUrl}</small></p>
            <p>This reset link will expire in ${expiresIn}.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset - PartPal

      Hello ${user.name},

      Reset your password: ${resetUrl}

      This link expires in ${expiresIn}.
      If you didn't request this, please ignore this email.
    `;

    return { subject, html, text };
  }

  private generateSellerVerificationTemplate(data: SellerVerificationEmailData): EmailTemplate {
    const { seller, user, adminUrl } = data;
    const subject = 'New Seller Registration Pending Verification';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .info { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Seller Registration</h1>
          <p>A new seller has registered and requires verification:</p>

          <div class="info">
            <h3>Business Information</h3>
            <p><strong>Business Name:</strong> ${seller.businessName}</p>
            <p><strong>Business Type:</strong> ${seller.businessType}</p>
            <p><strong>Contact Person:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${(seller as any).phone}</p>
            <p><strong>Location:</strong> ${(seller as any).city}, ${(seller as any).province}</p>
          </div>

          <p style="text-align: center;">
            <a href="${adminUrl}" class="button">Review in Admin Panel</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
      New Seller Registration - PartPal

      Business: ${seller.businessName} (${seller.businessType})
      Contact: ${user.name} (${user.email})
      Phone: ${(seller as any).phone}
      Location: ${(seller as any).city}, ${(seller as any).province}

      Review: ${adminUrl}
    `;

    return { subject, html, text };
  }

  private generateSellerApprovalTemplate(seller: Seller, user: User): EmailTemplate {
    const subject = 'PartPal Seller Account Approved';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seller Account Approved</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${user.name}!</h2>
            <p>Your PartPal seller account for <strong>${seller.businessName}</strong> has been approved!</p>
            <p>You can now:</p>
            <ul>
              <li>Add vehicles to your inventory</li>
              <li>List auto parts for sale</li>
              <li>Publish parts to the marketplace</li>
              <li>Manage your business profile</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.IMS_FRONTEND_URL || 'http://localhost:3001'}" class="button">Access Your Dashboard</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Seller Account Approved - PartPal

      Congratulations ${user.name}!

      Your seller account for ${seller.businessName} has been approved.
      Access your dashboard: ${process.env.IMS_FRONTEND_URL || 'http://localhost:3001'}
    `;

    return { subject, html, text };
  }

  private generateSellerRejectionTemplate(seller: Seller, user: User, reason?: string): EmailTemplate {
    const subject = 'PartPal Seller Application Update';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Thank you for your interest in becoming a verified seller on PartPal.</p>
            <p>Unfortunately, we cannot approve your seller application for <strong>${seller.businessName}</strong> at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You can reapply after addressing any issues mentioned above.</p>
            <p>If you have questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Seller Application Update - PartPal

      Hello ${user.name},

      We cannot approve your seller application for ${seller.businessName} at this time.
      ${reason ? `Reason: ${reason}` : ''}

      You may reapply after addressing any issues.
    `;

    return { subject, html, text };
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}

export const emailService = EmailService.getInstance();