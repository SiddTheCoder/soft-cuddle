/**
 * TOTP (RFC 6238) via `otpauth`. Shared with the admin bootstrap CLI — see the
 * note in `crypto.core.ts`. Application code imports `./totp`.
 */
import { Secret, TOTP } from 'otpauth';

import { decryptSecret, encryptSecret } from './crypto.core';

/**
 * One step either side of now. Wider windows meaningfully extend how long a
 * phished code stays usable, so this stays at 1.
 */
const WINDOW = 1;

function totpFor(secretBase32: string, label: string): TOTP {
  return new TOTP({
    issuer: process.env.COMPANY_NAME ?? 'Softmato',
    label,
    algorithm: 'SHA1', // What every authenticator app implements.
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export interface TotpEnrolment {
  /** Store this on the user row — already encrypted. */
  encryptedSecret: string;
  /** Render as a QR code. Never log it; it contains the shared secret. */
  otpauthUri: string;
}

export function createTotpEnrolment(email: string): TotpEnrolment {
  const secret = new Secret({ size: 20 }); // 160 bits, per RFC 4226
  const totp = totpFor(secret.base32, email);

  return {
    encryptedSecret: encryptSecret(secret.base32),
    otpauthUri: totp.toString(),
  };
}

/**
 * Returns true only for a currently-valid code. Fails closed on a malformed
 * secret or code — an uncertain verification is a failed one (docs/RULES.md §5).
 */
export function verifyTotp(encryptedSecret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code.trim())) return false;

  try {
    const totp = totpFor(decryptSecret(encryptedSecret), 'verify');
    return totp.validate({ token: code.trim(), window: WINDOW }) !== null;
  } catch {
    // A secret that will not decrypt means tampering or a rotated key.
    // Either way the answer is "not authenticated".
    return false;
  }
}
