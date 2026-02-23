import { Resend } from 'resend';
import { FRONTEND_URL, RESEND_API_KEY } from '../config/env';

class EmailService {
    private resend: Resend | null = null;
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (RESEND_API_KEY) {
            this.resend = new Resend(RESEND_API_KEY);
            this.isInitialized = true;
        } else {
            console.warn('⚠️  RESEND_API_KEY not found. Email service is disabled.');
        }
    }

    async sendVerificationEmail(to: string, token: string, name: string) {
        if (!this.isInitialized || !this.resend) {
            // Fallback for local testing without an API key
            const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
            console.warn('🚨 EMAIL SERVICE DISABLED. If you are testing locally, manually click this link to verify:');
            console.warn(`🔗 ${verificationUrl}`);
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
            const response = await this.resend.emails.send({
                from: 'Gelitik Team <onboarding@resend.dev>', // Update this when you have a custom domain!
                to: [to],
                subject: 'Please verify your email address - Gelitik',
                html: html,
            });

            if (response.error) {
                console.error('Resend API Error:', response.error);
                throw new Error(response.error.message);
            }
        } catch (error) {
            console.error('Error sending verification email via Resend:', error);
            throw new Error('Failed to send verification email');
        }
    }
}

export const emailService = new EmailService();
