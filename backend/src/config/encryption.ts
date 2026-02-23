import crypto from 'crypto';

/**
 * AES-256-GCM encryption for sensitive data like OAuth tokens
 * Uses environment variable ENCRYPTION_KEY (must be 32 bytes hex or base64)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Throws if not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // Support both hex and base64 encoded keys
  const keyBuffer = Buffer.from(key, key.length === 64 ? 'hex' : 'base64');

  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return keyBuffer;
}

/**
 * Encrypts plaintext using AES-256-GCM
 * Returns base64 encoded string: IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Format: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypts base64 encoded ciphertext
 * Returns original plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return encryptedData;
  }

  const key = getEncryptionKey();
  const data = Buffer.from(encryptedData, 'base64');

  // Extract IV, AuthTag, and Ciphertext
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Check if data appears to be encrypted (has proper format)
 */
export function isEncrypted(data: string | null | undefined): boolean {
  if (!data) {
    return false;
  }

  try {
    const buffer = Buffer.from(data, 'base64');
    // Minimum: IV + AuthTag + at least 1 byte of ciphertext
    return buffer.length > IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Generate a secure random key for configuration
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
