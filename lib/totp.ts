// lib/totp.ts — Autenticación Multifactor TOTP (RFC 6238)
// Compatible con Google Authenticator, Microsoft Authenticator, Authy, 1Password.
// Cubre RNF-01 (MFA obligatorio) y previene DEF-01/DEF-02/DEF-03 de la matriz
// de defectos: tolerancia de ±1 ventana, expiración estricta, y exigencia de MFA
// completo antes de emitir sesión.

import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configuración estricta para mitigar DEF-01 (desfase horario) y DEF-02 (códigos vencidos)
authenticator.options = {
  window: 1,      // tolera ±1 ventana (±30s) — suficiente para desfase razonable, no laxo
  step: 30,
  digits: 6,
};

const ISSUER = process.env.TOTP_ISSUER ?? 'SAGAF UAF Panama';

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(correo: string, secret: string): string {
  return authenticator.keyuri(correo, ISSUER, secret);
}

export async function buildQrDataUrl(correo: string, secret: string): Promise<string> {
  const otpauth = buildOtpAuthUrl(correo, secret);
  return QRCode.toDataURL(otpauth, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
}

export function verifyCode(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  const trimmed = code.replace(/\s/g, '').trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  try {
    return authenticator.check(trimmed, secret);
  } catch {
    return false;
  }
}
