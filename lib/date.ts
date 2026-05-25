const TZ = 'America/Panama';

function toUTC(dateStr: string): string {
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  if (normalized.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(normalized)) return normalized;
  return normalized + 'Z';
}

export function formatPanama(dateStr: string): string {
  return new Date(toUTC(dateStr)).toLocaleString('es-PA', { timeZone: TZ });
}

export function formatPanamaShort(dateStr: string): string {
  return new Date(toUTC(dateStr)).toLocaleString('es-PA', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' });
}

export function formatPanamaMedium(dateStr: string): string {
  return new Date(toUTC(dateStr)).toLocaleString('es-PA', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });
}

export function formatPanamaDate(dateStr: string): string {
  return new Date(toUTC(dateStr)).toLocaleDateString('es-PA', { timeZone: TZ });
}
