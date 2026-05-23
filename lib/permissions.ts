// lib/permissions.ts — Control de acceso por rol (RF-05, RNF-02)
// Previene DEF-06 (frontend oculta botones, pero backend valida permisos reales).
import { db } from './db';

export type Role = 'sujeto_obligado' | 'analista' | 'supervisor' | 'auditor' | 'admin';

export interface AuthSubject {
  id: string;
  correo: string;
  rol: Role;
  sujeto_obligado_id: string | null;
}

const permisosByRol = db.prepare<[string], { codigo: string }>(`
  SELECT p.codigo
    FROM permiso p
    JOIN rol_permiso rp ON rp.permiso_id = p.id
    JOIN rol r          ON r.id = rp.rol_id
   WHERE r.nombre = ?
`);

export function getPermissions(rol: Role): string[] {
  return permisosByRol.all(rol).map((r) => r.codigo);
}

export function hasPermission(subject: AuthSubject | null | undefined, codigo: string): boolean {
  if (!subject) return false;
  return getPermissions(subject.rol).includes(codigo);
}

export function requirePermission(
  subject: AuthSubject | null | undefined,
  codigo: string,
): asserts subject is AuthSubject {
  if (!subject) throw new ForbiddenError('No autenticado');
  if (!hasPermission(subject, codigo))
    throw new ForbiddenError(`Permiso requerido: ${codigo}`);
}

export function requireRole(
  subject: AuthSubject | null | undefined,
  ...roles: Role[]
): asserts subject is AuthSubject {
  if (!subject) throw new ForbiddenError('No autenticado');
  if (!roles.includes(subject.rol))
    throw new ForbiddenError(`Rol requerido: ${roles.join(', ')}`);
}

/**
 * Sujetos obligados solo pueden ver ROS de su propia entidad (RF-05, DEF-05 IDOR).
 * Roles UAF/admin/auditor pueden ver según permisos.
 */
export function canAccessROS(subject: AuthSubject, rosSujetoObligadoId: string): boolean {
  if (subject.rol === 'sujeto_obligado') {
    return subject.sujeto_obligado_id === rosSujetoObligadoId;
  }
  return ['analista', 'supervisor', 'admin'].includes(subject.rol);
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
