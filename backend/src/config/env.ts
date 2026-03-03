/**
 * Centralized configuration for environment variables
 * Throws errors on startup if required variables are missing
 */

function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// JWT_SECRET - Required for production security
// Throws on startup if not set to prevent insecure fallback
export const JWT_SECRET = getRequiredEnvVar('JWT_SECRET');

// SESSION_SECRET - Required for session security
// Throws on startup if not set to prevent insecure fallback
export const SESSION_SECRET = getRequiredEnvVar('SESSION_SECRET');

// FRONTEND_URL - Required for redirects
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// PORT - Optional, defaults to 3000
export const PORT = parseInt(process.env.PORT || '3000', 10);

// RESEND_API_KEY - Optional, required for production emails
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
