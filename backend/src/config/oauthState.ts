import crypto from 'crypto';

// Simple in-memory store for OAuth state validation
// NOTE: For production, use proper session management (e.g., express-session)
const stateStore = new Map<string, { userId: string; platform: string; expiresAt: number }>();

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random state string for OAuth security
 */
export function generateOAuthState(userId: string, platform: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, {
        userId,
        platform,
        expiresAt: Date.now() + STATE_EXPIRY_MS
    });

    // Clean up expired states periodically
    cleanupExpiredStates();

    return state;
}

/**
 * Validate and consume an OAuth state string
 * Returns the associated data if valid, null otherwise
 */
export function validateOAuthState(state: string): { userId: string; platform: string } | null {
    const data = stateStore.get(state);

    if (!data) {
        return null;
    }

    // Check if expired
    if (Date.now() > data.expiresAt) {
        stateStore.delete(state);
        return null;
    }

    // Delete after validation (one-time use)
    stateStore.delete(state);

    return {
        userId: data.userId,
        platform: data.platform
    };
}

/**
 * Clean up expired state entries
 */
function cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
        if (now > data.expiresAt) {
            stateStore.delete(state);
        }
    }
}
