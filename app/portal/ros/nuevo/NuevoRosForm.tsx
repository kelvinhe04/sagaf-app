'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Plantilla { id: string; nombre: string; tipo_sujeto_obligado: string }
interface DocReq    { id: string; plantilla_id: string; nombre: string; orden: number }

interface PartyState {
  id: string;
  status: 'idle' | 'verified' | 'not_found' | 'error';
  nombre: string;
  message?: string;
}

interface Props {
  sujeto: { id: string; nombre: string; tipo: string };
  plantillas: Plantilla[];
  docsByPlantilla: Record<string, DocReq[]>;
  oficialDefault: string;
  correoDefault: string;
}

export function NuevoRosForm({ sujeto, plantillas, docsByPlantilla, oficialDefault, correoDefault }: Props) {
  const router = useRouter();
  const isBank = sujeto.tipo === 'bank';
  const isRealEstate = sujeto.tipo === 'realestate';

  const defaultPlantilla = plantillas[0]?.id ?? '';
  const [plantillaId, setPlantillaId] = useState(defaultPlantilla);
  const [tipoCliente, setTipoCliente] = useState<'natural' | 'juridica'>('natural');

  // Si el sujeto es banco, dos partes; si es inmobiliaria, una.
  const [ordenante, setOrdenante] = useState<PartyState>({ id: '', status: 'idle', nombre: '' });
  const [beneficiario, setBeneficiario] = useState<PartyState>({ id: '', status: 'idle', nombre: '' });
  const [comprador, setComprador] = useState<PartyState>({ id: '', status: 'idle', nombre: '' });

  const [monto, setMonto] = useState('');
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [senalAlerta, setSenalAlerta] = useState('Movimientos incompatibles con el perfil');
  const [productoServicio, setProductoServicio] = useState('');
  const [bienInmueble, setBienInmueble] = useState('');
  const [formaPago, setFormaPago] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [oficial, setOficial] = useState(oficialDefault);
  const [correoOficial, setCorreoOficial] = useState(correoDefault);
  const [fechaDeteccion, setFechaDeteccion] = useState(new Date().toISOString().slice(0, 10));

  // Archivos por documento requerido + evidencias adicionales
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [extras, setExtras] = useState<File[]>([]);

  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Para banco, mostramos plantilla automática según tipoCliente
  const effectivePlantillaId = useMemo(() => {
    if (!isBank) return plantillaId || defaultPlantilla;
    const want = tipoCliente === 'natural'
      ? plantillas.find((p) => p.id === 'pl_bank_natural')
      : plantillas.find((p) => p.id === 'pl_bank_legal');
    return want?.id ?? plantillaId ?? defaultPlantilla;
  }, [isBank, tipoCliente, plantillaId, plantillas, defaultPlantilla]);

  const docList = docsByPlantilla[effectivePlantillaId] ?? [];
  const cargados = Object.values(files).filter((f) => f).length;

  async function verifyParty(
    field: 'ordenante' | 'beneficiario' | 'comprador',
    state: PartyState,
    setState: (s: PartyState) => void,
  ) {
    if (!state.id.trim()) {
      setState({ ...state, status: 'error', message: 'Debe ingresar la cédula / RUC.' });
      return;
    }
    try {
      const res = await fetch('/api/personas/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: state.id, contexto: field }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ ...state, status: 'error', message: data.error ?? 'Error de verificación' });
        return;
      }
      if (data.found) {
        // Ley 81: SOLO se devuelve nombre. Resto sigue bloqueado.
        setState({ id: state.id, status: 'verified', nombre: data.nombre });
      } else {
        setState({ id: state.id, status: 'not_found', nombre: '', message: 'Sin coincidencia. La UAF validará con la documentación adjunta.' });
      }
    } catch {
      setState({ ...state, status: 'error', message: 'No fue posible verificar en este momento.' });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!descripcion.trim() || descripcion.length < 30) {
      setError('La descripción narrativa debe tener al menos 30 caracteres.');
      return;
    }
    if (!monto || Number.isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('El monto debe ser un número mayor a 0.');
      return;
    }
    if (isBank && !ordenante.id.trim()) {
      setError('Debe registrar al menos la cédula del ordenante (RF-06).');
      return;
    }
    if (isRealEstate && !comprador.id.trim()) {
      setError('Debe registrar la cédula del comprador (RF-06).');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Crear ROS
      const partes: Array<{ rol: string; tipo: string; identificador: string; nombre_visible: string }> = [];
      if (isBank) {
        if (ordenante.id.trim())
          partes.push({ rol: 'ordenante', tipo: tipoCliente, identificador: ordenante.id.trim(), nombre_visible: ordenante.nombre });
        if (beneficiario.id.trim())
          partes.push({ rol: 'beneficiario', tipo: tipoCliente, identificador: beneficiario.id.trim(), nombre_visible: beneficiario.nombre });
      }
      if (isRealEstate && comprador.id.trim()) {
        partes.push({ rol: 'comprador', tipo: 'natural', identificador: comprador.id.trim(), nombre_visible: comprador.nombre });
      }

      const res = await fetch('/api/ros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantilla_id: effectivePlantillaId,
          oficial_cumplimiento: oficial,
          correo_oficial: correoOficial,
          fecha_deteccion: fechaDeteccion,
          descripcion,
          operacion: {
            monto: Number(monto),
            jurisdiccion,
            senal_alerta: senalAlerta,
            producto_servicio: isBank ? productoServicio : null,
            bien_inmueble: isRealEstate ? bienInmueble : null,
            forma_pago: isRealEstate ? formaPago : null,
            tipo_operacion: isBank ? 'bancaria' : 'inmobiliaria',
          },
          partes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'No fue posible crear el ROS.');
        return;
      }

      // 2. Subir documentos individualmente — un fetch por archivo, asociado al docReqId.
      // Esto previene DEF-15 (archivo en contenedor equivocado).
      for (const docReq of docList) {
        const file = files[docReq.id];
        if (!file) continue;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('ros_id', data.id);
        fd.append('documento_requerido_id', docReq.id);
        const up = await fetch('/api/documentos/upload', { method: 'POST', body: fd });
        if (!up.ok) {
          const upErr = await up.json().catch(() => ({}));
          setError(`Error subiendo "${docReq.nombre}": ${upErr.error ?? up.statusText}`);
          return;
        }
      }
      // 3. Subir evidencias extra
      for (const extra of extras) {
        const fd = new FormData();
        fd.append('file', extra);
        fd.append('ros_id', data.id);
        await fetch('/api/documentos/upload', { method: 'POST', body: fd });
      }

      setSuccess(`ROS ${data.numero_ros} enviado correctamente a la UAF.`);
      startTransition(() => {
        setTimeout(() => router.push(`/portal/ros/${data.id}`), 1200);
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="section-title">1. Datos generales del ROS</div>

        <div className="field">
          <label>Entidad reportante</label>
          <input value={sujeto.nombre} disabled />
        </div>
        <div className="field">
          <label>Fecha de detección</label>
          <input type="date" value={fechaDeteccion} onChange={(e) => setFechaDeteccion(e.target.value)} required />
        </div>
        <div className="field">
          <label>Oficial de cumplimiento</label>
          <input value={oficial} onChange={(e) => setOficial(e.target.value)} required placeholder="Nombre completo" />
        </div>
        <div className="field">
          <label>Correo institucional</label>
          <input type="email" value={correoOficial} onChange={(e) => setCorreoOficial(e.target.value)} required placeholder="correo@entidad.com" />
        </div>

        <div className="section-title">2. Validación de personas relacionadas</div>
        <div className="notice" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
          <strong>Privacidad (Ley 81/2019)</strong>: si una cédula/RUC ya existe en nuestros registros,
          solo verás el <strong>nombre</strong> para corroboración. No se autocompletan datos sensibles.
        </div>

        {isBank && (
          <>
            <div className="field">
              <label>Tipo de cliente</label>
              <select value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value as 'natural' | 'juridica')}>
                <option value="natural">Persona Natural</option>
                <option value="juridica">Persona Jurídica</option>
              </select>
            </div>
            <div className="field full">
              <div className="helper">Para reportes bancarios, valide por separado al <strong>ordenante</strong> y al <strong>beneficiario</strong> (RF-06).</div>
              <div className="lookup-grid">
                <PartyCard label="Persona que realiza la transacción" role="Ordenante"
                  state={ordenante} setState={setOrdenante}
                  onVerify={() => verifyParty('ordenante', ordenante, setOrdenante)} />
                <PartyCard label="Beneficiario" role="Beneficiario"
                  state={beneficiario} setState={setBeneficiario}
                  onVerify={() => verifyParty('beneficiario', beneficiario, setBeneficiario)} />
              </div>
            </div>
          </>
        )}

        {isRealEstate && (
          <div className="field full">
            <div className="helper">Verifique al comprador. El sistema solo mostrará el nombre si la cédula existe (RF-06).</div>
            <div className="lookup-grid single">
              <PartyCard label="Cliente / Comprador reportado" role="Comprador"
                state={comprador} setState={setComprador}
                onVerify={() => verifyParty('comprador', comprador, setComprador)} />
            </div>
          </div>
        )}

        <div className="section-title">3. Información de la operación sospechosa</div>
        <div className="field">
          <label>Monto aproximado (USD)</label>
          <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="985000" required />
        </div>
        <div className="field">
          <label>{isRealEstate ? 'Ubicación del bien inmueble' : 'Jurisdicción relacionada'}</label>
          <input value={jurisdiccion} onChange={(e) => setJurisdiccion(e.target.value)} placeholder={isRealEstate ? 'Costa del Este, Panamá' : 'Panamá / Suiza'} />
        </div>
        <div className="field">
          <label>Tipología / señal de alerta</label>
          <select value={senalAlerta} onChange={(e) => setSenalAlerta(e.target.value)}>
            <option>Movimientos incompatibles con el perfil</option>
            <option>Uso de terceros o testaferros</option>
            <option>Procedencia de fondos no sustentada</option>
            <option>Operaciones fraccionadas</option>
            <option>Transferencias internacionales inusuales</option>
          </select>
        </div>
        {isBank && (
          <div className="field">
            <label>Producto bancario involucrado</label>
            <input value={productoServicio} onChange={(e) => setProductoServicio(e.target.value)} placeholder="Cuenta, préstamo, tarjeta, transferencia…" />
          </div>
        )}
        {isRealEstate && (
          <>
            <div className="field">
              <label>Bien inmueble involucrado</label>
              <input value={bienInmueble} onChange={(e) => setBienInmueble(e.target.value)} placeholder="Apartamento, finca, casa, local…" />
            </div>
            <div className="field">
              <label>Forma de pago</label>
              <input value={formaPago} onChange={(e) => setFormaPago(e.target.value)} placeholder="Efectivo, transferencia, mixto…" />
            </div>
          </>
        )}
        <div className="field full">
          <label>Descripción narrativa de los hechos</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required minLength={30}
            placeholder="Explique la operación, la inusualidad detectada, las gestiones realizadas y por qué se considera sospechosa." />
          <div className="helper">Mínimo 30 caracteres. Una narrativa insuficiente puede generar solicitud de subsanación.</div>
        </div>

        <div className="section-title">4. Sustento documental individualizado (RF-07)</div>
        <div className="field full">
          <div className="doc-summary">
            <div className="info-box"><span>Requeridos</span><strong>{docList.length}</strong></div>
            <div className="info-box"><span>Cargados</span><strong>{cargados}</strong></div>
            <div className="info-box"><span>Pendientes</span><strong>{docList.length - cargados}</strong></div>
          </div>
          <div className="helper">Cada documento tiene su propio contenedor. Esto evita el defecto DEF-15 (archivo en contenedor equivocado).</div>
        </div>

        <div className="field full">
          <div className="doc-grid">
            {docList.map((d, i) => {
              const file = files[d.id] ?? null;
              return (
                <div key={d.id} className={`doc-card${file ? ' uploaded' : ''}`}>
                  <div className="doc-top">
                    <div className="doc-title">{i + 1}. {d.nombre}</div>
                    <span className={`badge ${file ? 'green' : 'amber'}`}>{file ? 'Cargado' : 'Pendiente'}</span>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setFiles({ ...files, [d.id]: e.target.files?.[0] ?? null })}
                  />
                  {file && <div className="file-name">Archivo: {file.name}</div>}
                  <div className="helper">Carga individual para identificar este sustento de forma separada.</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="field full">
          <label>Evidencia adicional no catalogada</label>
          <input type="file" multiple onChange={(e) => setExtras(Array.from(e.target.files ?? []))} />
          <div className="helper">Fotografías, notas, correos u otros archivos complementarios que no están en la plantilla.</div>
        </div>

        {error && <div className="client-status error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
        {success && <div className="client-status found" style={{ gridColumn: '1 / -1' }}>{success}</div>}

        <div className="action-row" style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn primary" disabled={submitting || pending}>
            {submitting ? 'Enviando ROS a la UAF…' : 'Enviar ROS a la UAF'}
          </button>
        </div>
      </div>
    </form>
  );
}

function PartyCard({
  label, role, state, setState, onVerify,
}: {
  label: string;
  role: string;
  state: PartyState;
  setState: (s: PartyState) => void;
  onVerify: () => void;
}) {
  return (
    <div className="lookup-card">
      <div className="lookup-title">{label}</div>
      <div className="lookup-row">
        <input
          placeholder={`Cédula del ${role.toLowerCase()}`}
          value={state.id}
          onChange={(e) => setState({ ...state, id: e.target.value, status: 'idle', nombre: '' })}
        />
        <button type="button" className="btn secondary" onClick={onVerify}>Verificar</button>
      </div>
      {state.status === 'verified' && (
        <div className="client-status found">
          Coincidencia encontrada. Por privacidad, únicamente se muestra el nombre del {role.toLowerCase()}.
        </div>
      )}
      {state.status === 'not_found' && (
        <div className="client-status warning">{state.message}</div>
      )}
      {state.status === 'error' && (
        <div className="client-status error">{state.message}</div>
      )}
      <div className="field full">
        <label>Nombre encontrado</label>
        <input value={state.nombre} readOnly placeholder="Solo se mostrará el nombre si existe coincidencia" />
      </div>
    </div>
  );
}
