// /api/vinculos — Confirmar / descartar vínculo intersectorial (CU-07)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

const patchSchema = z.object({
  id: z.string().min(1),
  confirmado: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['analista', 'supervisor'].includes(session.user.rol))
    return NextResponse.json({ error: 'Permiso insuficiente' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const v = db.prepare<[string], { ros_origen_id: string; ros_destino_id: string }>(
    'SELECT ros_origen_id, ros_destino_id FROM vinculo_intersectorial WHERE id = ?',
  ).get(parsed.data.id);
  if (!v) return NextResponse.json({ error: 'Vínculo no encontrado' }, { status: 404 });

  db.prepare(
    'UPDATE vinculo_intersectorial SET confirmado = ?, decidido_por = ?, fecha_decision = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(parsed.data.confirmado ? 1 : 0, session.user.id, parsed.data.id);

  // Si confirmado, el ROS pasa a estado 'vinculado'
  if (parsed.data.confirmado) {
    db.prepare('UPDATE ros SET estado = ? WHERE id IN (?, ?)')
      .run('vinculado', v.ros_origen_id, v.ros_destino_id);
  }

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'vinculos',
    accion: parsed.data.confirmado ? 'confirmar_vinculo' : 'descartar_vinculo',
    resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { vinculo_id: parsed.data.id },
    criticidad: parsed.data.confirmado ? 'alta' : 'normal',
  });

  return NextResponse.json({ ok: true });
}
