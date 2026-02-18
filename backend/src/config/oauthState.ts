import { oauthStateDb } from './oauthStateDb';

/**
 * OAuth State Management - Database-backed
 *
 * This module provides database-backed OAuth state storage for CSRF protection.
 * It replaces the previous in-memory Map implementation to support horizontal scaling.
 */

// Re-export for backward compatibility
export { oauthStateDb };

/**
 * Generate a random state string for OAuth security (async wrapper)
 */
export async function generateOAuthState(userId: string, platform: string, codeVerifier?: string): Promise<string> {
    return await oauthStateDb.generateState(userId, platform, codeVerifier);
}

/**
 * Validate and consume an OAuth state string (async wrapper)
 */
export async function validateOAuthState(state: string): Promise<{ userId: string; platform: string; codeVerifier?: string } | null> {
    return await oauthStateDb.validateState(state);
}
