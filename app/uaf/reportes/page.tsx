import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { KpiCard } from '@/components/KpiCard';
import { Badge } from '@/components/Badge';
import { InfoBox } from '@/components/InfoBox';

export const revalidate = 0;

interface SP { tipo?: string }

interface ResumenSector {
  sector: string;
  total: number;
  alto: number;
  medio: number;
  bajo: number;
  monto: number;
}

interface ResumenRiesgo { nivel: string; total: number }

interface ResumenDocs { nombre: string; total: number; cargados: number }

interface ResumenTiempo {
  numero_ros: string;
  fecha_recepcion: string;
  ultimo_evento: string | null;
  tiempo_horas: number | null;
}

export default async function ReportesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const { tipo = 'operativo' } = await searchParams;

  const totalROS    = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM ros`).get()!.c;
  const totalAlto   = db.prepare<[], { c: number }>(
    `SELECT COUNT(DISTINCT ros_id) AS c FROM riesgo_caso rc
       WHERE nivel = 'alto'
         AND fecha_clasificacion = (SELECT MAX(fecha_clasificacion) FROM riesgo_caso WHERE ros_id = rc.ros_id)`,
  ).get()!.c;
  const subsPend    = db.prepare<[], { c: number }>(
    `SELECT COUNT(*) AS c FROM solicitud_subsanacion WHERE estado = 'pendiente'`,
  ).get()!.c;
  const docsTotal   = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM documento_adjunto`).get()!.c;

  const porSector = db.prepare<[], ResumenSector>(
    `
    SELECT so.sector,
           COUNT(*) AS total,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id
                           ORDER BY fecha_clasificacion DESC LIMIT 1) = 'alto'  THEN 1 ELSE 0 END) AS alto,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id
                           ORDER BY fecha_clasificacion DESC LIMIT 1) = 'medio' THEN 1 ELSE 0 END) AS medio,
           SUM(CASE WHEN (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id
                           ORDER BY fecha_clasificacion DESC LIMIT 1) = 'bajo'  THEN 1 ELSE 0 END) AS bajo,
           COALESCE(SUM((SELECT monto FROM operacion_sospechosa WHERE ros_id = r.id)), 0) AS monto
      FROM ros r JOIN sujeto_obligado so ON so.id = r.sujeto_obligado_id
     GROUP BY so.sector
    `,
  ).all();

  const porRiesgo = db.prepare<[], ResumenRiesgo>(
    `
    SELECT rc.nivel, COUNT(DISTINCT rc.ros_id) AS total
      FROM riesgo_caso rc
     WHERE rc.fecha_clasificacion = (SELECT MAX(fecha_clasificacion) FROM riesgo_caso WHERE ros_id = rc.ros_id)
     GROUP BY rc.nivel
    `,
  ).all();

  const completitudDocs = db.prepare<[], ResumenDocs>(
    `
    SELECT dr.nombre,
           (SELECT COUNT(*) FROM ros r WHERE r.plantilla_id = dr.plantilla_id) AS total,
           (SELECT COUNT(*) FROM documento_adjunto da WHERE da.documento_requerido_id = dr.id) AS cargados
      FROM documento_requerido dr
     ORDER BY dr.plantilla_id, dr.orden
     LIMIT 25
    `,
  ).all();

  const tiempos = db.prepare<[], ResumenTiempo>(
    `
    SELECT r.numero_ros, r.fecha_recepcion,
           (SELECT MAX(fecha_hora_servidor) FROM evento_auditoria WHERE recurso_afectado = r.numero_ros) AS ultimo_evento,
           CAST(
             (julianday(COALESCE(
                (SELECT MAX(fecha_hora_servidor) FROM evento_auditoria WHERE recurso_afectado = r.numero_ros),
                r.fecha_recepcion
             )) - julianday(r.fecha_recepcion)) * 24 AS REAL
           ) AS tiempo_horas
      FROM ros r
     ORDER BY r.fecha_recepcion DESC
     LIMIT 10
    `,
  ).all();

  const userInitials = (session!.user.name ?? 'UA').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const canExport = session!.user.rol === 'supervisor';

  return (
    <>
      <TopBar
        eyebrow="Reportes e inteligencia financiera"
        title="Reportes operativos y estratégicos"
        description="Datos agregados, anonimizados cuando no requieren identificación individual. La exportación queda auditada."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge={session!.user.rol === 'supervisor' ? 'Supervisor · puede exportar' : 'Analista'}
      />

      <div className="kpis">
        <KpiCard label="Total ROS"            value={totalROS}   badge="Histórico"  tone="blue" />
        <KpiCard label="Alto riesgo"          value={totalAlto}  badge="Atención"   tone="red" />
        <KpiCard label="Subsanación pend."    value={subsPend}   badge="Pendientes" tone="amber" />
        <KpiCard label="Documentos adjuntos"  value={docsTotal}  badge="Sustento"   tone="green" />
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h3>Resumen por sector económico</h3>
            <p>Reporte operativo · agregados por sector reportante.</p>
          </div>
          {canExport ? (
            <a className="btn ghost" href="/api/reportes?tipo=operativo&formato=csv">Exportar CSV</a>
          ) : (
            <Badge tone="amber">Exportación reservada a Supervisor</Badge>
          )}
        </div>

        <table className="table">
          <thead>
            <tr><th>Sector</th><th>Total ROS</th><th>Alto</th><th>Medio</th><th>Bajo</th><th>Monto agregado (USD)</th></tr>
          </thead>
          <tbody>
            {porSector.map((s) => (
              <tr key={s.sector}>
                <td><strong>{s.sector}</strong></td>
                <td>{s.total}</td>
                <td><Badge tone="red">{s.alto}</Badge></td>
                <td><Badge tone="amber">{s.medio}</Badge></td>
                <td><Badge tone="green">{s.bajo}</Badge></td>
                <td>USD {s.monto.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="uaf-layout" style={{ marginTop: 18 }}>
        <div className="card">
          <h3 style={{ margin: 0 }}>Distribución por nivel de riesgo</h3>
          <p className="small" style={{ marginBottom: 12 }}>Reporte estadístico · datos agregados.</p>
          <div className="summary-grid">
            {porRiesgo.map((r) => (
              <InfoBox key={r.nivel} label={r.nivel} value={r.total} />
            ))}
            {porRiesgo.length === 0 && <div className="notice">Sin clasificaciones aún.</div>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0 }}>Tiempos de atención (últimos 10 ROS)</h3>
          <p className="small" style={{ marginBottom: 12 }}>Reporte operativo · tiempo desde recepción hasta último evento.</p>
          <table className="table">
            <thead><tr><th>ROS</th><th>Recibido</th><th>Tiempo (h)</th></tr></thead>
            <tbody>
              {tiempos.map((t) => (
                <tr key={t.numero_ros}>
                  <td><strong>{t.numero_ros}</strong></td>
                  <td>{new Date(t.fecha_recepcion).toLocaleString('es-PA')}</td>
                  <td>{t.tiempo_horas?.toFixed(1) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <div><h3>Reporte de completitud documental</h3><p>Permite identificar requisitos documentales con mayor faltante.</p></div>
        </div>
        <table className="table">
          <thead><tr><th>Documento requerido</th><th>Esperados</th><th>Cargados</th><th>Faltantes</th></tr></thead>
          <tbody>
            {completitudDocs.map((d, i) => (
              <tr key={i}>
                <td>{d.nombre}</td>
                <td>{d.total}</td>
                <td><Badge tone="green">{d.cargados}</Badge></td>
                <td><Badge tone="amber">{Math.max(0, d.total - d.cargados)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="notice" style={{ marginTop: 18 }}>
        <strong>Privacidad por diseño</strong>: estos reportes priorizan datos agregados.
        Las exportaciones requieren rol Supervisor y quedan registradas en el log de auditoría.
      </div>
    </>
  );
}
