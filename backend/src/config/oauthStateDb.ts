import crypto from 'crypto';
import prisma from '../config/prisma';

const STATE_EXPIRY_MINUTES = 10;

/**
 * OAuthStateDb - Database-backed OAuth state storage
 *
 * Replaces in-memory Map with persistent database storage.
 * Enables horizontal scaling and prevents state loss on restart.
 */
export class OAuthStateDb {
  /**
   * Generate a new OAuth state and store in database
   */
  async generateState(userId: string, platform: string, codeVerifier?: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + STATE_EXPIRY_MINUTES * 60 * 1000);

    const metadata: Record<string, any> = {};
    if (codeVerifier) {
      metadata.codeVerifier = codeVerifier;
    }

    await prisma.oAuthState.create({
      data: {
        state,
        userId,
        platform,
        expiresAt,
        metadata
      }
    });

    // Cleanup old states periodically
    this.cleanupExpiredStates().catch(err => {
      console.error('[OAuthStateDb] Cleanup error:', err.message);
    });

    return state;
  }

  /**
   * Validate OAuth state - returns state data if valid, null if invalid/expired
   */
  async validateState(state: string): Promise<{ userId: string; platform: string; codeVerifier?: string } | null> {
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { state }
    });

    if (!stateRecord) {
      return null;
    }

    // Check if expired
    if (new Date() > stateRecord.expiresAt) {
      // Clean up expired state
      await prisma.oAuthState.delete({ where: { state } }).catch(() => {});
      return null;
    }

    const metadata = (stateRecord.metadata as Record<string, any>) || {};

    // Delete state after use (one-time use)
    await prisma.oAuthState.delete({ where: { state } }).catch(() => {});

    return {
      userId: stateRecord.userId,
      platform: stateRecord.platform,
      codeVerifier: metadata.codeVerifier
    };
  }

  /**
   * Clean up expired states - call periodically
   */
  async cleanupExpiredStates(): Promise<number> {
    const result = await prisma.oAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    if (result.count > 0) {
    }

    return result.count;
  }
}

// Export singleton instance
export const oauthStateDb = new OAuthStateDb();
