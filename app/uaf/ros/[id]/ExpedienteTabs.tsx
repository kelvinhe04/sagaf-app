'use client';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/Badge';
import { Timeline } from '@/components/Timeline';

interface DocReq  { id: string; nombre: string; orden: number }
interface DocAdj  {
  id: string; documento_requerido_id: string | null; nombre_archivo: string;
  estado: string; observacion: string | null; fecha_carga: string;
}
interface Vinc    { id: string; numero_ros: string; tipo_vinculo: string; descripcion: string | null; confirmado: boolean }
interface AuditEv { title: string; description: string; tone?: 'default' | 'red' | 'amber' | 'green' }
interface SubsRow { id: string; motivo: string; estado: string; fecha_solicitud: string; documento_adjunto_id: string | null }

interface Props {
  rosId: string;
  numeroRos: string;
  canClassify: boolean;
  canClose: boolean;
  summary: ReactNode;
  riesgoNode: ReactNode;
  docsReq: DocReq[];
  docsAdj: DocAdj[];
  vinculos: Vinc[];
  auditEvents: AuditEv[];
  subs: SubsRow[];
}

type Tab = 'resumen' | 'riesgo' | 'documentos' | 'vinculos' | 'auditoria';

export function RosExpedienteTabs({
  rosId, numeroRos, canClassify, canClose,
  summary, riesgoNode, docsReq, docsAdj, vinculos, auditEvents, subs,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('resumen');

  // Acciones
  const [busy, setBusy] = useState(false);

  // Clasificación de riesgo
  const [riesgoNivel, setRiesgoNivel] = useState<'alto' | 'medio' | 'bajo'>('alto');
  const [riesgoPuntaje, setRiesgoPuntaje] = useState(70);
  const [riesgoJustif, setRiesgoJustif] = useState('');

  // Subsanación
  const [subDocId, setSubDocId] = useState<string>('');
  const [subMotivo, setSubMotivo] = useState('');

  // Cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState<string>('en_analisis');

  async function clasificar(e: React.FormEvent) {
    e.preventDefault();
    if (riesgoJustif.trim().length < 15) { alert('La justificación debe tener al menos 15 caracteres (CU-02 RE-01).'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ros/${rosId}/riesgo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel: riesgoNivel, puntaje: riesgoPuntaje, justificacion: riesgoJustif }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Error al clasificar.'); return; }
      setRiesgoJustif('');
      router.refresh();
    } finally { setBusy(false); }
  }

  async function solicitarSubsanacion(e: React.FormEvent) {
    e.preventDefault();
    if (subMotivo.trim().length < 10) { alert('El motivo debe tener al menos 10 caracteres.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ros/${rosId}/subsanacion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_adjunto_id: subDocId || null, motivo: subMotivo }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Error.'); return; }
      setSubMotivo(''); setSubDocId('');
      router.refresh();
    } finally { setBusy(false); }
  }

  async function cambiarEstado(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/ros/${rosId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Error.'); return; }
      router.refresh();
    } finally { setBusy(false); }
  }

  async function marcarDocumento(docId: string, estado: 'observado' | 'validado', observacion?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/documentos/${docId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, observacion: observacion ?? null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Error.'); return; }
      router.refresh();
    } finally { setBusy(false); }
  }

  async function confirmarVinculo(vincId: string, confirmar: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/vinculos`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vincId, confirmado: confirmar }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Error.'); return; }
      router.refresh();
    } finally { setBusy(false); }
  }

  const adjByReq = new Map(docsAdj.filter((d) => d.documento_requerido_id).map((d) => [d.documento_requerido_id!, d]));
  const extras = docsAdj.filter((d) => !d.documento_requerido_id);

  return (
    <div className="card">
      <div className="tabs">
        <button className={`tab ${tab === 'resumen' ? 'active' : ''}`}     onClick={() => setTab('resumen')}>Resumen</button>
        <button className={`tab ${tab === 'riesgo' ? 'active' : ''}`}      onClick={() => setTab('riesgo')}>Riesgo</button>
        <button className={`tab ${tab === 'documentos' ? 'active' : ''}`}  onClick={() => setTab('documentos')}>Documentos ({docsAdj.length}/{docsReq.length})</button>
        <button className={`tab ${tab === 'vinculos' ? 'active' : ''}`}    onClick={() => setTab('vinculos')}>Vínculos ({vinculos.length})</button>
        <button className={`tab ${tab === 'auditoria' ? 'active' : ''}`}   onClick={() => setTab('auditoria')}>Auditoría</button>
      </div>

      {tab === 'resumen' && (
        <>
          {summary}

          <div className="action-row">
            {canClassify && (
              <form onSubmit={cambiarEstado} style={{ display: 'flex', gap: 8 }}>
                <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                  <option value="en_analisis">En análisis</option>
                  <option value="revision_documental">Revisión documental</option>
                  <option value="subsanacion">Subsanación</option>
                  <option value="escalado">Escalado</option>
                  <option value="vinculado">Vinculado</option>
                  {canClose && <option value="cerrado">Cerrado</option>}
                </select>
                <button className="btn secondary" disabled={busy}>Actualizar estado</button>
              </form>
            )}
          </div>
        </>
      )}

      {tab === 'riesgo' && (
        <>
          {riesgoNode}

          {canClassify && (
            <div className="card" style={{ marginTop: 14, padding: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Clasificar riesgo</h3>
              <p className="small" style={{ marginBottom: 12 }}>RF-02 · La justificación es obligatoria y queda auditada.</p>
              <form onSubmit={clasificar}>
                <div className="form-grid">
                  <div className="field">
                    <label>Nivel</label>
                    <select value={riesgoNivel} onChange={(e) => setRiesgoNivel(e.target.value as 'alto' | 'medio' | 'bajo')}>
                      <option value="alto">Alto</option>
                      <option value="medio">Medio</option>
                      <option value="bajo">Bajo</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Puntaje (0-100)</label>
                    <input type="number" min={0} max={100} value={riesgoPuntaje} onChange={(e) => setRiesgoPuntaje(Number(e.target.value))} />
                  </div>
                  <div className="field full">
                    <label>Justificación</label>
                    <textarea value={riesgoJustif} onChange={(e) => setRiesgoJustif(e.target.value)} placeholder="Justifique los criterios de la clasificación…" required minLength={15} />
                  </div>
                  <div className="field full">
                    <button className="btn primary" disabled={busy}>{busy ? 'Guardando…' : 'Registrar clasificación'}</button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {tab === 'documentos' && (
        <>
          <div className="doc-summary">
            <div className="info-box"><span>Recibidos</span><strong>{docsAdj.filter((d) => d.documento_requerido_id).length}</strong></div>
            <div className="info-box"><span>Pendientes</span><strong>{docsReq.length - docsAdj.filter((d) => d.documento_requerido_id).length}</strong></div>
            <div className="info-box"><span>Observados</span><strong>{docsAdj.filter((d) => d.estado === 'observado').length}</strong></div>
          </div>

          <div className="doc-grid">
            {docsReq.map((dr, i) => {
              const adj = adjByReq.get(dr.id);
              const tone =
                adj?.estado === 'validado' ? 'teal' :
                adj?.estado === 'observado' ? 'red' :
                adj?.estado === 'cargado' ? 'green' : 'amber';
              const klass = adj?.estado === 'observado' ? 'observed' : adj?.estado === 'validado' ? 'validated' : adj?.estado === 'cargado' ? 'uploaded' : '';
              return (
                <div key={dr.id} className={`doc-card ${klass}`}>
                  <div className="doc-top">
                    <div className="doc-title">{i + 1}. {dr.nombre}</div>
                    <Badge tone={tone as 'teal' | 'red' | 'green' | 'amber'}>{adj?.estado ?? 'pendiente'}</Badge>
                  </div>
                  {adj ? (
                    <>
                      <div className="file-name">Archivo: {adj.nombre_archivo}</div>
                      <div className="small">Recibido: {new Date(adj.fecha_carga).toLocaleString('es-PA')}</div>
                      {adj.observacion && (
                        <div className="client-status warning">
                          <strong>Observación:</strong> {adj.observacion}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <a href={`/api/documentos/${adj.id}/file`} target="_blank" className="btn ghost" rel="noreferrer">Ver</a>
                        <button className="btn green"
                          onClick={() => marcarDocumento(adj.id, 'validado')}
                          disabled={busy}>Validar</button>
                        <button className="btn amber"
                          onClick={() => {
                            const obs = prompt('Observación para el sujeto obligado:');
                            if (obs) marcarDocumento(adj.id, 'observado', obs);
                          }}
                          disabled={busy}>Observar</button>
                      </div>
                    </>
                  ) : (
                    <div className="helper">Pendiente. Puedes solicitar subsanación al sujeto obligado.</div>
                  )}
                </div>
              );
            })}
          </div>

          {extras.length > 0 && (
            <>
              <h3 style={{ marginTop: 18, marginBottom: 8 }}>Evidencia adicional</h3>
              <div className="doc-grid">
                {extras.map((e) => (
                  <div key={e.id} className="doc-card">
                    <div className="doc-top">
                      <div className="doc-title">{e.nombre_archivo}</div>
                      <Badge tone="gray">extra</Badge>
                    </div>
                    <div className="small">Recibido: {new Date(e.fecha_carga).toLocaleString('es-PA')}</div>
                    <a href={`/api/documentos/${e.id}/file`} target="_blank" className="btn ghost" rel="noreferrer">Ver</a>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="card" style={{ marginTop: 14, padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Solicitar subsanación al sujeto obligado</h3>
            <p className="small" style={{ marginBottom: 12 }}>CU-08 · Permite que el sujeto obligado corrija sin crear un ROS nuevo.</p>

            <form onSubmit={solicitarSubsanacion}>
              <div className="form-grid">
                <div className="field full">
                  <label>Documento observado (opcional)</label>
                  <select value={subDocId} onChange={(e) => setSubDocId(e.target.value)}>
                    <option value="">(Sin documento asociado — observación general)</option>
                    {docsAdj.map((d) => <option key={d.id} value={d.id}>{d.nombre_archivo}</option>)}
                  </select>
                </div>
                <div className="field full">
                  <label>Motivo</label>
                  <textarea value={subMotivo} onChange={(e) => setSubMotivo(e.target.value)} required minLength={10}
                    placeholder="Describe el motivo (archivo ilegible, falta sustento, inconsistencia…)" />
                </div>
                <div className="field full">
                  <button className="btn amber" disabled={busy}>{busy ? 'Enviando…' : 'Solicitar subsanación'}</button>
                </div>
              </div>
            </form>
          </div>

          {subs.length > 0 && (
            <div className="card" style={{ marginTop: 14, padding: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Subsanaciones de este expediente</h3>
              <Timeline events={subs.map((s) => ({
                title: `Subsanación #${s.id.slice(0, 8)} · ${s.estado}`,
                description: `${s.motivo} — ${new Date(s.fecha_solicitud).toLocaleString('es-PA')}`,
                tone: s.estado === 'pendiente' ? 'amber' : 'green',
              }))} />
            </div>
          )}
        </>
      )}

      {tab === 'vinculos' && (
        <>
          {vinculos.length === 0 ? (
            <div className="notice">No se detectaron vínculos para este ROS.</div>
          ) : (
            <div className="report-list">
              {vinculos.map((v) => (
                <div key={v.id} className="report-item" style={{ cursor: 'default' }}>
                  <div className="report-top">
                    <strong>↔ {v.numero_ros}</strong>
                    <Badge tone={v.confirmado ? 'green' : 'amber'}>{v.confirmado ? 'Confirmado' : 'Por validar'}</Badge>
                  </div>
                  <div className="report-meta">
                    <span><strong>Tipo:</strong> {v.tipo_vinculo}</span>
                    {v.descripcion && <span>{v.descripcion}</span>}
                  </div>
                  <div className="action-row">
                    {!v.confirmado && (
                      <>
                        <button className="btn green" onClick={() => confirmarVinculo(v.id, true)}  disabled={busy}>Confirmar vínculo</button>
                        <button className="btn red"   onClick={() => confirmarVinculo(v.id, false)} disabled={busy}>Descartar</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="notice" style={{ marginTop: 12 }}>
            CU-07 · Las vinculaciones detectadas automáticamente <strong>no se consolidan sin revisión humana</strong> (RE-01).
          </div>
        </>
      )}

      {tab === 'auditoria' && (
        <>
          {auditEvents.length === 0 ? (
            <div className="notice">Sin eventos auditables para este ROS aún.</div>
          ) : (
            <Timeline events={auditEvents} />
          )}
          <div className="notice" style={{ marginTop: 12 }}>
            El log de auditoría es <strong>inmutable</strong> (trigger ABORT en BD · RF-03 RE-01).
            La hora la genera el servidor, no el navegador (mitiga DEF-30).
          </div>
        </>
      )}
    </div>
  );
}
