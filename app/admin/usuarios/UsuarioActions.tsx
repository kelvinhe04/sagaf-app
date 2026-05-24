'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';

export function UsuarioActions({ usuarioId, estadoActual }: { usuarioId: string; estadoActual: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const desactivar = estadoActual === 'activo';
  const nuevo = desactivar ? 'inactivo' : 'activo';

  async function toggle() {
    setBusy(true);
    setOpen(false);
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
    <>
      <button
        className={`btn ${desactivar ? 'amber' : 'green'}`}
        onClick={() => setOpen(true)}
        disabled={busy}
        style={{ padding: '8px 12px', fontSize: 12 }}
      >
        {desactivar ? 'Desactivar' : 'Activar'}
      </button>

      <ConfirmModal
        isOpen={open}
        variant={desactivar ? 'warning' : 'success'}
        title={desactivar ? '¿Desactivar usuario?' : '¿Activar usuario?'}
        message={
          desactivar
            ? 'El usuario no podrá iniciar sesión mientras esté inactivo. Puedes reactivarlo en cualquier momento.'
            : 'El usuario podrá volver a iniciar sesión. Esta acción queda registrada en auditoría.'
        }
        confirmLabel={desactivar ? 'Sí, desactivar' : 'Sí, activar'}
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={toggle}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
