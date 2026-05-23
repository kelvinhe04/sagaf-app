'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UsuarioActions({ usuarioId, estadoActual }: { usuarioId: string; estadoActual: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const nuevo = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿${nuevo === 'inactivo' ? 'Desactivar' : 'Activar'} este usuario?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? 'Error.');
        return;
      }
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <button className={`btn ${estadoActual === 'activo' ? 'amber' : 'green'}`} onClick={toggle} disabled={busy}
            style={{ padding: '8px 12px', fontSize: 12 }}>
      {estadoActual === 'activo' ? 'Desactivar' : 'Activar'}
    </button>
  );
}
