import nodemailer from 'nodemailer';
import { FRONTEND_URL } from '../config/env';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            // For development, use Ethereal Email (auto-generated test accounts)
            // In production, you would configure SMTP credentials here from process.env
            const testAccount = await nodemailer.createTestAccount();

            this.transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            this.isInitialized = true;
            console.log('✉️  Email service initialized (Ethereal test mode)');
        } catch (error) {
            console.error('Failed to initialize email service:', error);
        }
    }

    async sendVerificationEmail(to: string, token: string, name: string) {
        if (!this.isInitialized || !this.transporter) {
            console.warn('Email service not initialized. Skipping email send.');
            return;
        }

        const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid black; padding: 20px;">
                <h1 style="text-transform: uppercase; font-weight: 900; margin-top: 0;">Welcome to Gelitik, ${name}!</h1>
                <p style="font-size: 16px; font-weight: bold;">We're stoked to have you onboard.</p>
                <p style="font-size: 16px;">Please click the button below to verify your email address and activate your account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #FFCC00; color: black; border: 3px solid black; padding: 15px 30px; text-decoration: none; font-weight: 900; font-size: 18px; text-transform: uppercase; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                <p style="font-size: 12px; word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
            </div>
        `;

        try {
            const info = await this.transporter.sendMail({
                from: '"Gelitik Team" <noreply@gelitik.app>',
                to,
                subject: 'Please verify your email address - Gelitik',
                html,
            });

            console.log('✅ Verification email sent to:', to);
            // In Ethereal mode, this URL lets you preview the email in your browser!
            console.log('🔎 Preview URL: %s', nodemailer.getTestMessageUrl(info));
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}

export const emailService = new EmailService();
