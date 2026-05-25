import { db } from '@/lib/db';
import { Badge } from './Badge';
import { formatPanama } from '@/lib/date';
import { AuditFilters, type AuditFilterValues } from './AuditFilters';

interface Row {
  id: string;
  fecha_hora_servidor: string;
  usuario_correo: string | null;
  rol: string | null;
  modulo: string;
  accion: string;
  resultado: string;
  ip: string | null;
  recurso_afectado: string | null;
  criticidad: string;
  detalle: string | null;
}

interface Props {
  filters: AuditFilterValues;
}

/**
 * Tabla del log de auditoría inmutable (CU-03).
 * El log NO se puede modificar desde la UI (trigger ABORT en BD).
 */
export function AuditTable({ filters }: Props) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    where.push('(usuario_correo LIKE ? OR accion LIKE ? OR recurso_afectado LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.modulo)     { where.push('modulo = ?');      params.push(filters.modulo); }
  if (filters.resultado)  { where.push('resultado = ?');   params.push(filters.resultado); }
  if (filters.criticidad) { where.push('criticidad = ?');  params.push(filters.criticidad); }
  if (filters.desde)      { where.push('fecha_hora_servidor >= ?'); params.push(filters.desde); }
  if (filters.hasta)      { where.push('fecha_hora_servidor <= ?'); params.push(filters.hasta + ' 23:59:59'); }

  const sql = `
    SELECT id, fecha_hora_servidor, usuario_correo, rol, modulo, accion, resultado, ip, recurso_afectado, criticidad, detalle
      FROM evento_auditoria
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY fecha_hora_servidor DESC
     LIMIT 200
  `;
  const rows = db.prepare<unknown[], Row>(sql).all(...params);

  const toneByCriticidad: Record<string, 'gray' | 'amber' | 'red'> = {
    normal: 'gray', alta: 'amber', critica: 'red',
  };

  const toneByResultado: Record<string, 'green' | 'red' | 'amber'> = {
    exito: 'green', fallo: 'red', bloqueado: 'amber',
  };

  return (
    <>
      <AuditFilters initial={filters} />

      {rows.length === 0 ? (
        <div className="notice">Sin eventos para los filtros seleccionados.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha (servidor)</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Resultado</th>
                <th>Recurso</th>
                <th>Criticidad</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatPanama(r.fecha_hora_servidor)}</td>
                  <td>{r.usuario_correo ?? <span className="small">system</span>}</td>
                  <td><span className="small">{r.rol ?? '—'}</span></td>
                  <td>{r.modulo}</td>
                  <td><strong>{r.accion}</strong>{r.detalle && <div className="small">{r.detalle.slice(0, 90)}{r.detalle.length > 90 ? '…' : ''}</div>}</td>
                  <td><Badge tone={toneByResultado[r.resultado] ?? 'gray'}>{r.resultado}</Badge></td>
                  <td>{r.recurso_afectado ?? '—'}</td>
                  <td><Badge tone={toneByCriticidad[r.criticidad] ?? 'gray'}>{r.criticidad}</Badge></td>
                  <td className="small">{r.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="notice" style={{ marginTop: 12 }}>
        Mostrando los 200 eventos más recientes. El log es <strong>inmutable</strong> y todas
        las consultas al log también quedan auditadas.
      </div>
    </>
  );
}
