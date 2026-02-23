import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('Testing Resend API...');
console.log('API Key starts with:', process.env.RESEND_API_KEY?.substring(0, 8));

async function test() {
    try {
        const response = await resend.emails.send({
            from: 'Gelitik Team <onboarding@resend.dev>',
            to: ['delivery@resend.dev'], // Resend test email
            subject: 'Test Verification',
            html: '<p>It works</p>'
        });
        console.log('Response:', response);
    } catch (e) {
        console.error('Caught error:', e);
    }
}

test();
