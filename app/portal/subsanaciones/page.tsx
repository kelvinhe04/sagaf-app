import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/Badge';

export const revalidate = 0;

interface Row {
  id: string;
  ros_id: string;
  numero_ros: string;
  motivo: string;
  estado: string;
  fecha_solicitud: string;
  documento_nombre: string | null;
}

export default async function SubsanacionesPage() {
  const session = await auth();
  const soId = session!.user.sujetoObligadoId!;

  const rows = db.prepare<[string], Row>(
    `
    SELECT s.id, s.ros_id, r.numero_ros, s.motivo, s.estado, s.fecha_solicitud,
           da.nombre_archivo AS documento_nombre
      FROM solicitud_subsanacion s
      JOIN ros r ON r.id = s.ros_id
      LEFT JOIN documento_adjunto da ON da.id = s.documento_adjunto_id
     WHERE r.sujeto_obligado_id = ?
     ORDER BY s.fecha_solicitud DESC
    `,
  ).all(soId);

  return (
    <>
      <TopBar
        eyebrow="Subsanación documental"
        title="Solicitudes de subsanación de la UAF"
        description="Atienda las observaciones de la UAF sin crear un ROS nuevo. Suba el archivo corregido desde el detalle del ROS asociado."
      />

      <div className="card">
        {rows.length === 0 ? (
          <div className="notice green">No tienes solicitudes de subsanación pendientes.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ROS</th>
                <th>Solicitud</th>
                <th>Motivo</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong style={{ color: '#0f3e69' }}>{r.numero_ros}</strong></td>
                  <td>#{r.id.slice(0, 8)}</td>
                  <td>{r.motivo}</td>
                  <td>{r.documento_nombre ?? '—'}</td>
                  <td><Badge tone={r.estado === 'pendiente' ? 'amber' : 'green'}>{r.estado}</Badge></td>
                  <td>{new Date(r.fecha_solicitud).toLocaleString('es-PA')}</td>
                  <td>
                    <Link href={`/portal/ros/${r.ros_id}`} className="btn primary" style={{ padding: '8px 12px', fontSize: 12 }}>
                      Atender
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
