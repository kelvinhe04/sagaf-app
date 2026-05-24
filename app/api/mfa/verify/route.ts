// POST /api/mfa/verify — Verifica el código TOTP del usuario.
// En éxito actualiza el JWT con mfaVerified=true directamente en la cookie
// y devuelve `ok:true`; el cliente solo debe navegar a su panel.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { verifyCode } from '@/lib/totp';
import { audit, extractRequestContext } from '@/lib/audit';
import { encode, decode } from '@auth/core/jwt';

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

  // Actualiza el JWT directamente para que el middleware vea mfaVerified=true
  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https') ?? false;
  const cookiePrefix = useSecureCookies ? '__Secure-' : '';
  const cookieName = `${cookiePrefix}authjs.session-token`;

  const cookieHeader = req.headers.get('cookie') || '';
  const allCookies: { name: string; value: string }[] = [];
  cookieHeader.split(';').forEach(c => {
    const idx = c.indexOf('=');
    if (idx > 0) {
      const name = c.substring(0, idx).trim();
      const value = c.substring(idx + 1).trim();
      allCookies.push({ name, value });
    }
  });

  const chunks = allCookies
    .filter(c => c.name === cookieName || c.name.startsWith(cookieName + '.'))
    .sort((a, b) => {
      const aSuffix = parseInt(a.name.split('.').pop() || '0');
      const bSuffix = parseInt(b.name.split('.').pop() || '0');
      return aSuffix - bSuffix;
    });

  if (chunks.length > 0) {
    const tokenValue = chunks.map(c => c.value).join('');
    try {
      const decoded = await decode({
        token: tokenValue,
        secret: process.env.AUTH_SECRET!,
        salt: cookieName,
      });
      if (decoded) {
        decoded.mfaVerified = true;
        const newToken = await encode({
          token: decoded,
          secret: process.env.AUTH_SECRET!,
          salt: cookieName,
          maxAge: 30 * 24 * 60 * 60,
        });
        const response = NextResponse.json({ ok: true });
        response.cookies.set(cookieName, newToken, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: useSecureCookies,
        });
        return response;
      }
    } catch {
      // Si falla la actualización del JWT, responder ok de todas formas
    }
  }

  return NextResponse.json({ ok: true });
}
