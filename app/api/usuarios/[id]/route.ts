// PATCH /api/usuarios/[id] — Activar/desactivar usuario (CU-05)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

const schema = z.object({
  estado: z.enum(['activo', 'inactivo']).optional(),
  rol_id: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (session.user.rol !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

  if (id === session.user.id) {
    return NextResponse.json({ error: 'No puedes modificar tu propia cuenta desde aquí' }, { status: 400 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const u = db.prepare<[string], { correo: string }>('SELECT correo FROM usuario WHERE id = ?').get(id);
  if (!u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if (parsed.data.estado) {
    db.prepare('UPDATE usuario SET estado = ? WHERE id = ?').run(parsed.data.estado, id);
  }
  if (parsed.data.rol_id) {
    const rol = db.prepare('SELECT 1 FROM rol WHERE id = ?').get(parsed.data.rol_id);
    if (!rol) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    db.prepare('UPDATE usuario SET rol_id = ? WHERE id = ?').run(parsed.data.rol_id, id);
  }

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'admin', accion: 'actualizar_usuario', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { usuario_id: id, correo_afectado: u.correo, cambios: parsed.data },
    criticidad: 'alta',
  });

  return NextResponse.json({ ok: true });
}
