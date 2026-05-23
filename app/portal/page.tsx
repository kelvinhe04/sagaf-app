import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { KpiCard } from '@/components/KpiCard';
import { Badge, estadoTone, estadoLabel, riskTone } from '@/components/Badge';

interface SujetoRow { id: string; nombre: string; tipo: string; sector: string }

interface RosResumen {
  id: string;
  numero_ros: string;
  estado: string;
  fecha_recepcion: string;
  monto: number;
  nivel_riesgo: string | null;
  doc_total: number;
  doc_cargados: number;
  pendientes_subsanacion: number;
}

export default async function PortalHome() {
  const session = await auth();
  const soId = session!.user.sujetoObligadoId!;

  const so = db
    .prepare<[string], SujetoRow>('SELECT id, nombre, tipo, sector FROM sujeto_obligado WHERE id = ?')
    .get(soId);

  const ros = db
    .prepare<[string], RosResumen>(
      `
      SELECT r.id, r.numero_ros, r.estado, r.fecha_recepcion,
             COALESCE((SELECT monto FROM operacion_sospechosa WHERE ros_id = r.id), 0) AS monto,
             (SELECT nivel FROM riesgo_caso WHERE ros_id = r.id
               ORDER BY fecha_clasificacion DESC LIMIT 1) AS nivel_riesgo,
             (SELECT COUNT(*) FROM documento_requerido dr
               JOIN plantilla_ros pl ON pl.id = dr.plantilla_id
              WHERE pl.id = r.plantilla_id) AS doc_total,
             (SELECT COUNT(*) FROM documento_adjunto da
               WHERE da.ros_id = r.id AND da.documento_requerido_id IS NOT NULL) AS doc_cargados,
             (SELECT COUNT(*) FROM solicitud_subsanacion s
               WHERE s.ros_id = r.id AND s.estado = 'pendiente') AS pendientes_subsanacion
        FROM ros r
       WHERE r.sujeto_obligado_id = ?
       ORDER BY r.fecha_recepcion DESC
      `,
    )
    .all(soId);

  const totales = {
    total: ros.length,
    enAnalisis: ros.filter((r) => r.estado === 'en_analisis').length,
    subsanacion: ros.filter((r) => r.pendientes_subsanacion > 0).length,
    altos: ros.filter((r) => r.nivel_riesgo === 'alto').length,
  };

  const userInitials = (session!.user.name ?? 'SO').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        eyebrow="Portal del sujeto obligado"
        title={`Bienvenido, ${so?.nombre ?? 'Sujeto Obligado'}`}
        description="Registre nuevos Reportes de Operaciones Sospechosas, consulte el estado de los enviados y atienda las solicitudes de subsanación de la UAF."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge={`${so?.tipo === 'bank' ? 'Banco' : so?.tipo === 'realestate' ? 'Inmobiliaria' : so?.tipo} · MFA activo`}
      />

      <div className="kpis">
        <KpiCard label="Total de ROS" value={totales.total} badge="Histórico" tone="blue" />
        <KpiCard label="En análisis UAF" value={totales.enAnalisis} badge="Recibidos" tone="blue" />
        <KpiCard label="Con subsanación pendiente" value={totales.subsanacion} badge="Atender" tone="amber" />
        <KpiCard label="Clasificados alto riesgo" value={totales.altos} badge="Prioridad" tone="red" />
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h3>Mis Reportes de Operaciones Sospechosas</h3>
            <p>Únicamente visualizas los ROS de tu entidad (RF-05 / RNF-02).</p>
          </div>
          <Link href="/portal/ros/nuevo" className="btn primary">+ Registrar nuevo ROS</Link>
        </div>

        {ros.length === 0 ? (
          <div className="notice">Aún no has registrado ningún ROS.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha recepción</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Riesgo</th>
                <th>Documentos</th>
                <th>Subsanación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ros.map((r) => (
                <tr key={r.id}>
                  <td><strong style={{ color: '#0f3e69' }}>{r.numero_ros}</strong></td>
                  <td>{new Date(r.fecha_recepcion).toLocaleString('es-PA')}</td>
                  <td><Badge tone={estadoTone(r.estado)}>{estadoLabel(r.estado)}</Badge></td>
                  <td>USD {r.monto.toLocaleString('en-US')}</td>
                  <td>
                    {r.nivel_riesgo
                      ? <Badge tone={riskTone(r.nivel_riesgo)}>{r.nivel_riesgo}</Badge>
                      : <span className="small">Sin clasificar</span>}
                  </td>
                  <td>{r.doc_cargados} / {r.doc_total}</td>
                  <td>
                    {r.pendientes_subsanacion > 0
                      ? <Badge tone="amber">{r.pendientes_subsanacion} pendiente(s)</Badge>
                      : <span className="small">—</span>}
                  </td>
                  <td>
                    <Link href={`/portal/ros/${r.id}`} className="btn ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
