'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Plantilla { id: string; nombre: string; tipo_sujeto_obligado: string }

export function NuevoSujetoForm({ plantillas }: { plantillas: Plantilla[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [tipo, setTipo] = useState('bank');
  const [sector, setSector] = useState('financiero');
  const [organismo, setOrganismo] = useState('');
  const [responsable, setResponsable] = useState('');
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compatibles = plantillas.filter((p) => p.tipo_sujeto_obligado === tipo);

  function toggle(id: string) {
    setSeleccionadas((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (seleccionadas.length === 0) {
      setError('Debe asociar al menos una plantilla ROS.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/sujetos-obligados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, ruc, tipo, sector,
          organismo_supervisor: organismo,
          responsable_cumpl: responsable,
          plantillas: seleccionadas,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error.'); return; }
      setNombre(''); setRuc(''); setOrganismo(''); setResponsable(''); setSeleccionadas([]);
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="field">
          <label>RUC / identificador</label>
          <input value={ruc} onChange={(e) => setRuc(e.target.value)} />
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setSeleccionadas([]); }}>
            <option value="bank">Banco</option>
            <option value="realestate">Inmobiliaria / Promotora</option>
            <option value="casino">Casino</option>
            <option value="abogado">Abogado / Notario</option>
            <option value="otro">Otro sector regulado</option>
          </select>
        </div>
        <div className="field">
          <label>Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="financiero">Financiero</option>
            <option value="no_financiero">No financiero</option>
          </select>
        </div>
        <div className="field">
          <label>Organismo supervisor</label>
          <input value={organismo} onChange={(e) => setOrganismo(e.target.value)} placeholder="Ej. Superintendencia de Bancos" />
        </div>
        <div className="field">
          <label>Responsable de cumplimiento</label>
          <input value={responsable} onChange={(e) => setResponsable(e.target.value)} />
        </div>

        <div className="field full">
          <label>Plantillas ROS a asociar</label>
          {compatibles.length === 0 ? (
            <div className="notice amber">No hay plantillas activas para este tipo. Cree una primero.</div>
          ) : (
            <div className="lookup-grid">
              {compatibles.map((p) => (
                <label key={p.id} className="lookup-card" style={{ cursor: 'pointer' }}>
                  <div className="lookup-row">
                    <input type="checkbox" style={{ width: 18, flex: 'none' }}
                           checked={seleccionadas.includes(p.id)}
                           onChange={() => toggle(p.id)} />
                    <strong>{p.nombre}</strong>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <div className="client-status error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
        <div className="field full">
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Registrando…' : 'Registrar sujeto obligado'}
          </button>
        </div>
      </div>
    </form>
  );
}
