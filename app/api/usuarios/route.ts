// /api/usuarios — Crear usuario (CU-05)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

const schema = z.object({
  nombre: z.string().min(2),
  correo: z.string().email(),
  password: z.string().min(8),
  rol_id: z.string().min(1),
  sujeto_obligado_id: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (session.user.rol !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  // Verificar que el rol existe y obtener su nombre
  const rol = db.prepare<[string], { nombre: string }>('SELECT nombre FROM rol WHERE id = ?').get(parsed.data.rol_id);
  if (!rol) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });

  // sujeto_obligado_id obligatorio si rol = sujeto_obligado
  if (rol.nombre === 'sujeto_obligado' && !parsed.data.sujeto_obligado_id) {
    return NextResponse.json({ error: 'Sujeto obligado requerido para este rol' }, { status: 400 });
  }

  // Correo único
  const existe = db.prepare('SELECT 1 FROM usuario WHERE correo = ?').get(parsed.data.correo);
  if (existe) return NextResponse.json({ error: 'Correo ya registrado' }, { status: 409 });

  const userId = randomUUID();
  const hash = bcrypt.hashSync(parsed.data.password, 10);

  db.prepare(`
    INSERT INTO usuario (id, nombre, correo, password_hash, rol_id, sujeto_obligado_id, estado, mfa_activo)
    VALUES (?, ?, ?, ?, ?, ?, 'activo', 0)
  `).run(
    userId, parsed.data.nombre, parsed.data.correo, hash, parsed.data.rol_id,
    parsed.data.sujeto_obligado_id ?? null,
  );

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'admin', accion: 'crear_usuario', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { nuevo_usuario_id: userId, correo: parsed.data.correo, rol_asignado: rol.nombre },
    criticidad: 'alta',
  });

  return NextResponse.json({ id: userId }, { status: 201 });
}
