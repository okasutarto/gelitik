import prisma from '../config/prisma';
import { encrypt, decrypt, isEncrypted } from '../config/encryption';

/**
 * TokenManager - Handles encrypted token storage with backward compatibility
 *
 * Provides transparent encryption/decryption for OAuth tokens stored in SocialAccount.
 * Supports migrating existing plain-text tokens to encrypted format.
 */
export class TokenManager {
  /**
   * Encrypt and store tokens for a social account
   */
  async storeTokens(
    accountId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    const updateData: any = {
      // Store encrypted tokens
      accessTokenEncrypted: encrypt(accessToken),
    };

    if (refreshToken) {
      updateData.refreshTokenEncrypted = encrypt(refreshToken);
    }

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: updateData,
    });
  }

  /**
   * Retrieve and decrypt access token for a social account
   * Handles both encrypted and legacy plain-text tokens
   */
  async getAccessToken(accountId: string): Promise<string | null> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: {
        accessToken: true,
        accessTokenEncrypted: true,
      },
    });

    if (!account) {
      return null;
    }

    // First try encrypted field
    if (account.accessTokenEncrypted && isEncrypted(account.accessTokenEncrypted)) {
      return decrypt(account.accessTokenEncrypted);
    }

    // Fallback to legacy plain-text field
    if (account.accessToken) {
      // Migrate to encrypted storage
      await this.migrateToEncrypted(accountId);
      return account.accessToken;
    }

    return null;
  }

  /**
   * Retrieve and decrypt refresh token for a social account
   * Handles both encrypted and legacy plain-text tokens
   */
  async getRefreshToken(accountId: string): Promise<string | null> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: {
        refreshToken: true,
        refreshTokenEncrypted: true,
      },
    });

    if (!account) {
      return null;
    }

    // First try encrypted field
    if (account.refreshTokenEncrypted && isEncrypted(account.refreshTokenEncrypted)) {
      return decrypt(account.refreshTokenEncrypted);
    }

    // Fallback to legacy plain-text field
    if (account.refreshToken) {
      return account.refreshToken;
    }

    return null;
  }

  /**
   * Migrate existing plain-text tokens to encrypted storage
   */
  async migrateToEncrypted(accountId: string): Promise<void> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return;
    }

    const updateData: any = {};

    // Migrate access token if it exists and is not already encrypted
    if (account.accessToken && !isEncrypted(account.accessToken)) {
      updateData.accessTokenEncrypted = encrypt(account.accessToken);
    }

    // Migrate refresh token if it exists and is not already encrypted
    if (account.refreshToken && !isEncrypted(account.refreshToken)) {
      updateData.refreshTokenEncrypted = encrypt(account.refreshToken);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.socialAccount.update({
        where: { id: accountId },
        data: updateData,
      });
    }
  }

  /**
   * Update tokens after refresh
   */
  async updateTokens(
    accountId: string,
    newAccessToken: string,
    newRefreshToken?: string
  ): Promise<void> {
    await this.storeTokens(accountId, newAccessToken, newRefreshToken);
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
