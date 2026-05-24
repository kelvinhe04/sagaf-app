// lib/masking.ts — Enmascaramiento de identificadores (Ley 81/2019 + RNF-01)
// Estas funciones NO deben usarse para tomar decisiones de autorización: son
// solo presentacionales. Las decisiones siempre se hacen contra el id real.

export function maskIdentifier(id: string | null | undefined): string {
  if (!id) return '***';
  const clean = id.replace(/[^0-9A-Z]/gi, '');
  if (clean.length <= 3) return '***';
  return `***-***-${clean.slice(-3)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `**@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskAmount(amount: number, role: string): string {
  // Sujetos obligados ven el monto completo del ROS propio; otros roles según permisos.
  if (role === 'auditor') return '***';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Enmascara patrones de cédula/RUC dentro de texto libre (Ley 81)
// Reconoce: N-NNN-NNNN, NN-NNN-NNNN, RUC-XXXXXX
export function maskDescriptionText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\b(\d{1,2}-\d{2,4}-\d{1,5}[A-Z]?)\b/gi, (match) => maskIdentifier(match))
    .replace(/\bRUC[-\s][\w-]+/gi, (match) => {
      const parts = match.split(/[-\s]/);
      const last = parts[parts.length - 1];
      return `RUC ***-${last.slice(-2)}`;
    });
}

export function normalizeIdentifier(raw: string): string {
  // Previene DEF-10 (búsquedas que fallan por formato): normaliza guiones,
  // espacios, ceros iniciales y mayúsculas.
  return raw.trim().toUpperCase().replace(/\s+/g, '').replace(/^0+/, '');
}
