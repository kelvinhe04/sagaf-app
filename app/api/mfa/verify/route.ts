// POST /api/mfa/verify — Verifica el código TOTP del usuario.
// En éxito devuelve `ok:true`; el cliente debe llamar a `session.update({ mfaVerified: true })`
// y luego navegar a su panel. (RNF-01, previene DEF-03)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { verifyCode } from '@/lib/totp';
import { audit, extractRequestContext } from '@/lib/audit';

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

interface Row { mfa_secret: string | null; mfa_activo: number; correo: string }

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Código MFA inválido' }, { status: 400 });
  }

  const row = db.prepare<[string], Row>(
    'SELECT mfa_secret, mfa_activo, correo FROM usuario WHERE id = ?',
  ).get(session.user.id);

  if (!row?.mfa_secret) {
    return NextResponse.json({ error: 'MFA no inicializado' }, { status: 400 });
  }

  const ctx = extractRequestContext(req);
  const ok = verifyCode(row.mfa_secret, parsed.data.code);

  if (!ok) {
    audit({
      modulo: 'autenticacion',
      accion: 'mfa_verify_failed',
      resultado: 'fallo',
      usuario_id: session.user.id,
      usuario_correo: row.correo,
      rol: session.user.rol,
      ip: ctx.ip,
      user_agent: ctx.user_agent,
      criticidad: 'alta',
    });
    return NextResponse.json({ error: 'Código incorrecto o expirado' }, { status: 401 });
  }

  if (row.mfa_activo === 0) {
    db.prepare('UPDATE usuario SET mfa_activo = 1 WHERE id = ?').run(session.user.id);
  }

  audit({
    modulo: 'autenticacion',
    accion: 'mfa_verify_ok',
    resultado: 'exito',
    usuario_id: session.user.id,
    usuario_correo: row.correo,
    rol: session.user.rol,
    ip: ctx.ip,
    user_agent: ctx.user_agent,
  });

  return NextResponse.json({ ok: true });
}
