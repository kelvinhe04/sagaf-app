import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/Badge';
import { maskDescriptionText } from '@/lib/masking';
import { VinculoActions } from './VinculoActions';

export const revalidate = 0;

interface Row {
  id: string;
  ros_origen_id: string;
  ros_destino_id: string;
  numero_origen: string;
  numero_destino: string;
  tipo_vinculo: string;
  descripcion: string | null;
  confirmado: number;
  fecha_deteccion: string;
}

export default async function VinculosPage() {
  const session = await auth();
  const filas = db.prepare<[], Row>(
    `
    SELECT v.id, v.ros_origen_id, v.ros_destino_id, v.tipo_vinculo, v.descripcion, v.confirmado, v.fecha_deteccion,
           r1.numero_ros AS numero_origen, r2.numero_ros AS numero_destino
      FROM vinculo_intersectorial v
      JOIN ros r1 ON r1.id = v.ros_origen_id
      JOIN ros r2 ON r2.id = v.ros_destino_id
     ORDER BY v.fecha_deteccion DESC
    `,
  ).all();

  const userInitials = (session!.user.name ?? 'AU').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        eyebrow="Vinculación intersectorial"
        title="Vínculos detectados entre ROS"
        description="Coincidencias entre ROS de distintos sujetos obligados (personas, beneficiarios, sociedades, cuentas, inmuebles…). Requieren validación por un analista antes de consolidarse."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge="MFA activo"
      />

      <div className="card">
        {filas.length === 0 ? (
          <div className="notice">Sin vínculos detectados por el momento.</div>
        ) : (
          <div className="report-list">
            {filas.map((v) => (
              <div key={v.id} className="report-item" style={{ cursor: 'default' }}>
                <div className="report-top">
                  <strong>{v.numero_origen} ↔ {v.numero_destino}</strong>
                  <Badge tone={v.confirmado ? 'green' : 'amber'}>{v.confirmado ? 'Confirmado' : 'Por validar'}</Badge>
                </div>
                <div className="report-meta">
                  <span><strong>Tipo:</strong> {v.tipo_vinculo}</span>
                  {v.descripcion && <span>{maskDescriptionText(v.descripcion)}</span>}
                  <span>Detectado: {new Date(v.fecha_deteccion).toLocaleString('es-PA')}</span>
                </div>
                {!v.confirmado && <VinculoActions vincId={v.id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
