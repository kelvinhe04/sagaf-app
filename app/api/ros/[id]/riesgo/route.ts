// /api/ros/[id]/riesgo — Clasificar nivel de riesgo (CU-02, RF-02)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

const schema = z.object({
  nivel: z.enum(['bajo', 'medio', 'alto']),
  puntaje: z.number().int().min(0).max(100),
  justificacion: z.string().min(15, 'La justificación debe tener al menos 15 caracteres (RE-01)'),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['analista', 'supervisor'].includes(session.user.rol))
    return NextResponse.json({ error: 'Permiso insuficiente' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, { status: 400 });

  const ros = db.prepare<[string], { numero_ros: string }>(
    'SELECT numero_ros FROM ros WHERE id = ?',
  ).get(id);
  if (!ros) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  db.prepare(`
    INSERT INTO riesgo_caso (id, ros_id, nivel, puntaje, justificacion, clasificado_por)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), id, parsed.data.nivel, parsed.data.puntaje, parsed.data.justificacion, session.user.id);

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'ros', accion: 'clasificar_riesgo', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    recurso_afectado: ros.numero_ros, ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { nivel: parsed.data.nivel, puntaje: parsed.data.puntaje },
    criticidad: parsed.data.nivel === 'alto' ? 'alta' : 'normal',
  });

  return NextResponse.json({ ok: true });
}
