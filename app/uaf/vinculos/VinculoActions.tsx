'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';

export function VinculoActions({ vincId }: { vincId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'confirmar' | 'descartar' | null>(null);

  async function decide(confirmar: boolean) {
    setModal(null);
    setBusy(true);
    try {
      const res = await fetch('/api/vinculos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vincId, confirmado: confirmar }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? 'Error.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="action-row">
        <button className="btn green" disabled={busy} onClick={() => setModal('confirmar')}>Confirmar vínculo</button>
        <button className="btn red"   disabled={busy} onClick={() => setModal('descartar')}>Descartar</button>
      </div>

      <ConfirmModal
        isOpen={modal === 'confirmar'}
        variant="success"
        title="¿Confirmar vínculo intersectorial?"
        message="Se registrará el vínculo como confirmado y el estado del ROS cambiará a 'Vinculado'. Esta acción queda en auditoría."
        confirmLabel="Sí, confirmar vínculo"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={() => decide(true)}
        onCancel={() => setModal(null)}
      />

      <ConfirmModal
        isOpen={modal === 'descartar'}
        variant="warning"
        title="¿Descartar vínculo?"
        message="El vínculo detectado automáticamente será descartado. Esta acción queda registrada en auditoría."
        confirmLabel="Sí, descartar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={() => decide(false)}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
