// PATCH /api/sujetos-obligados/[id] — Activar / desactivar sujeto obligado (CU-06)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

const schema = z.object({
  estado: z.enum(['activo', 'inactivo']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['admin', 'supervisor'].includes(session.user.rol))
    return NextResponse.json({ error: 'Solo admin/supervisor' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const so = db.prepare<[string], { nombre: string }>('SELECT nombre FROM sujeto_obligado WHERE id = ?').get(id);
  if (!so) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  db.prepare('UPDATE sujeto_obligado SET estado = ? WHERE id = ?').run(parsed.data.estado, id);

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'admin', accion: 'actualizar_sujeto_obligado', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { id, nombre: so.nombre, estado: parsed.data.estado },
  });

  return NextResponse.json({ ok: true });
}
