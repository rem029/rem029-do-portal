import crypto from 'crypto'

/**
 * Generates a completely agnostic, cryptographically secure hex string token.
 * Reusable across any feature requiring secure link handshakes.
 */
export function generateSecureHexToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}
