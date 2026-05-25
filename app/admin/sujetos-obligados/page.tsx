import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/Badge';
import { NuevoSujetoForm } from './NuevoSujetoForm';

export const revalidate = 0;

interface Row {
  id: string;
  nombre: string;
  ruc: string | null;
  tipo: string;
  sector: string;
  organismo_supervisor: string | null;
  estado: string;
  responsable_cumpl: string | null;
  plantillas: number;
}

export default async function SujetosAdmin() {
  const session = await auth();

  const rows = db.prepare<[], Row>(
    `
    SELECT so.id, so.nombre, so.ruc, so.tipo, so.sector, so.organismo_supervisor,
           so.estado, so.responsable_cumpl,
           (SELECT COUNT(*) FROM sujeto_obligado_plantilla sop WHERE sop.sujeto_obligado_id = so.id) AS plantillas
      FROM sujeto_obligado so
     ORDER BY so.nombre
    `,
  ).all();

  const plantillas = db.prepare<[], { id: string; nombre: string; tipo_sujeto_obligado: string }>(
    `SELECT id, nombre, tipo_sujeto_obligado FROM plantilla_ros WHERE activa = 1 ORDER BY nombre`,
  ).all();

  return (
    <>
      <TopBar
        eyebrow="Gestión de sujetos obligados"
        title="Sujetos obligados"
        description="Registra, clasifica y administra sujetos obligados. Cada uno debe tener tipo, sector y plantilla ROS asociada. El registro queda auditado."
      />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUC</th>
              <th>Tipo</th>
              <th>Sector</th>
              <th>Organismo supervisor</th>
              <th>Responsable cumplimiento</th>
              <th>Plantillas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.nombre}</strong></td>
                <td className="small">{r.ruc ?? '—'}</td>
                <td>{r.tipo}</td>
                <td>{r.sector}</td>
                <td className="small">{r.organismo_supervisor ?? '—'}</td>
                <td>{r.responsable_cumpl ?? '—'}</td>
                <td><Badge tone={r.plantillas > 0 ? 'green' : 'amber'}>{r.plantillas}</Badge></td>
                <td><Badge tone={r.estado === 'activo' ? 'green' : 'red'}>{r.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ margin: 0 }}>Registrar nuevo sujeto obligado</h3>
        <p className="small" style={{ marginBottom: 14 }}>Debe asociarse al menos una plantilla ROS válida.</p>
        <NuevoSujetoForm plantillas={plantillas} />
      </div>
    </>
  );
}
