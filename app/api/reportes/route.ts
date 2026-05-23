// GET /api/reportes?tipo=operativo&formato=csv — Exportación controlada (CU-04)
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { audit, extractRequestContext } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // CU-04 RE-02: exportación requiere rol Supervisor + auditoría
  if (session.user.rol !== 'supervisor') {
    audit({
      modulo: 'reportes', accion: 'exportar_reporte', resultado: 'bloqueado',
      usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
      criticidad: 'alta',
    });
    return NextResponse.json({ error: 'La exportación está reservada al rol Supervisor (RE-02)' }, { status: 403 });
  }

  const url = new URL(req.url);
  const tipo = url.searchParams.get('tipo') ?? 'operativo';

  const rows = db.prepare<[], {
    sector: string; total: number; alto: number; medio: number; bajo: number; monto: number;
  }>(
    `
    SELECT so.sector,
           COUNT(*) AS total,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id ORDER BY fecha_clasificacion DESC LIMIT 1) = 'alto'  THEN 1 ELSE 0 END) AS alto,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id ORDER BY fecha_clasificacion DESC LIMIT 1) = 'medio' THEN 1 ELSE 0 END) AS medio,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id ORDER BY fecha_clasificacion DESC LIMIT 1) = 'bajo'  THEN 1 ELSE 0 END) AS bajo,
           COALESCE(SUM((SELECT monto FROM operacion_sospechosa WHERE ros_id = r.id)), 0) AS monto
      FROM ros r JOIN sujeto_obligado so ON so.id = r.sujeto_obligado_id
     GROUP BY so.sector
    `,
  ).all();

  const ctx = extractRequestContext(req);
  audit({
    modulo: 'reportes', accion: 'exportar_reporte', resultado: 'exito',
    usuario_id: session.user.id, usuario_correo: session.user.email, rol: session.user.rol,
    ip: ctx.ip, user_agent: ctx.user_agent,
    detalle: { tipo, formato: 'csv', registros: rows.length },
    criticidad: 'alta',
  });

  // CSV con cabecera. Marca de agua tipo "watermark" en el archivo (CU-03 export)
  const watermark = `# SAGAF — Exportación auditada · Usuario: ${session.user.email} · Generado: ${new Date().toISOString()}\n`;
  const header = 'sector,total,alto,medio,bajo,monto_usd\n';
  const body = rows.map((r) => `${r.sector},${r.total},${r.alto},${r.medio},${r.bajo},${r.monto}`).join('\n');

  return new NextResponse(watermark + header + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sagaf-${tipo}-${Date.now()}.csv"`,
    },
  });
}
