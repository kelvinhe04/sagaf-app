// /api/ros/[id] — GET y PATCH (cambio de estado)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';
import { canAccessROS } from '@/lib/permissions';

const patchSchema = z.object({
  estado: z.enum([
    'recibido', 'en_analisis', 'revision_documental', 'subsanacion', 'escalado', 'vinculado', 'cerrado',
  ]),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const ros = db.prepare<[string], { id: string; sujeto_obligado_id: string }>(
    'SELECT id, sujeto_obligado_id FROM ros WHERE id = ?',
  ).get(id);
  if (!ros) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const subject = {
    id: session.user.id, correo: session.user.email ?? '',
    rol: session.user.rol, sujeto_obligado_id: session.user.sujetoObligadoId,
  };
  if (!canAccessROS(subject, ros.sujeto_obligado_id)) {
    audit({
      modulo: 'ros', accion: 'acceso_ros', resultado: 'bloqueado',
      usuario_id: subject.id, usuario_correo: subject.correo, rol: subject.rol,
      recurso_afectado: id, criticidad: 'alta',
    });
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return NextResponse.json(ros);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['analista', 'supervisor'].includes(session.user.rol)) {
    return NextResponse.json({ error: 'Permiso insuficiente' }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

  // Solo Supervisor puede cerrar
  if (parsed.data.estado === 'cerrado' && session.user.rol !== 'supervisor') {
    return NextResponse.json({ error: 'Solo Supervisor puede cerrar casos' }, { status: 403 });
  }

  const ros = db.prepare<[string], { numero_ros: string; estado: string }>(
    'SELECT numero_ros, estado FROM ros WHERE id = ?',
  ).get(id);
  if (!ros) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  db.prepare('UPDATE ros SET estado = ? WHERE id = ?').run(parsed.data.estado, id);

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'ros', accion: 'cambio_estado', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    recurso_afectado: ros.numero_ros, ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { anterior: ros.estado, nuevo: parsed.data.estado },
  });

  return NextResponse.json({ ok: true });
}
