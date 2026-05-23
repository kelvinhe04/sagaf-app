'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initial: { q: string; tipo: string; riesgo: string; estado: string };
}

export function FilterBar({ initial }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q);
  const [tipo, setTipo] = useState(initial.tipo);
  const [riesgo, setRiesgo] = useState(initial.riesgo);
  const [estado, setEstado] = useState(initial.estado);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (tipo) sp.set('tipo', tipo);
    if (riesgo) sp.set('riesgo', riesgo);
    if (estado) sp.set('estado', estado);
    router.push(`/uaf?${sp.toString()}`);
  }

  function clear() {
    setQ(''); setTipo(''); setRiesgo(''); setEstado('');
    router.push('/uaf');
  }

  return (
    <form onSubmit={applyFilters} className="search-line">
      <input placeholder="Buscar ROS, entidad…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="">Todos los sectores</option>
        <option value="bank">Banco</option>
        <option value="realestate">Inmobiliaria</option>
      </select>
      <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
        <option value="">Cualquier riesgo</option>
        <option value="alto">Alto</option>
        <option value="medio">Medio</option>
        <option value="bajo">Bajo</option>
      </select>
      <select value={estado} onChange={(e) => setEstado(e.target.value)}>
        <option value="">Cualquier estado</option>
        <option value="recibido">Recibido</option>
        <option value="en_analisis">En análisis</option>
        <option value="revision_documental">Revisión documental</option>
        <option value="subsanacion">Subsanación</option>
        <option value="escalado">Escalado</option>
        <option value="vinculado">Vinculado</option>
        <option value="cerrado">Cerrado</option>
      </select>
      <button type="submit" className="btn primary">Filtrar</button>
      <button type="button" className="btn ghost" onClick={clear}>Limpiar</button>
    </form>
  );
}
