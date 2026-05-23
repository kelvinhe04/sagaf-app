// lib/audit.ts — Auditoría inmutable (RF-03, RNF-03, CU-03)
// Cada acción relevante debe registrarse. La hora la genera el servidor (DEF-30).
import { randomUUID } from 'node:crypto';
import { db } from './db';

export type AuditCriticidad = 'normal' | 'alta' | 'critica';

export interface AuditPayload {
  usuario_id?: string | null;
  usuario_correo?: string | null;
  rol?: string | null;
  modulo: string;
  accion: string;
  resultado: 'exito' | 'fallo' | 'bloqueado';
  ip?: string | null;
  user_agent?: string | null;
  recurso_afectado?: string | null;
  detalle?: Record<string, unknown> | string | null;
  criticidad?: AuditCriticidad;
}

const insert = db.prepare(`
  INSERT INTO evento_auditoria
    (id, usuario_id, usuario_correo, rol, modulo, accion, resultado, ip, user_agent, recurso_afectado, detalle, criticidad)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function audit(payload: AuditPayload): void {
  const detalle =
    payload.detalle && typeof payload.detalle !== 'string'
      ? JSON.stringify(payload.detalle)
      : (payload.detalle ?? null);

  insert.run(
    randomUUID(),
    payload.usuario_id ?? null,
    payload.usuario_correo ?? null,
    payload.rol ?? null,
    payload.modulo,
    payload.accion,
    payload.resultado,
    payload.ip ?? null,
    payload.user_agent ?? null,
    payload.recurso_afectado ?? null,
    detalle,
    payload.criticidad ?? 'normal',
  );
}

export function extractRequestContext(req: Request): { ip: string | null; user_agent: string | null } {
  const headers = req.headers;
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    null;
  const user_agent = headers.get('user-agent') ?? null;
  return { ip, user_agent };
}
