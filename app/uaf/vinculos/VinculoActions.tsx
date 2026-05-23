'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VinculoActions({ vincId }: { vincId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(confirmar: boolean) {
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
    <div className="action-row">
      <button className="btn green" disabled={busy} onClick={() => decide(true)}>Confirmar vínculo</button>
      <button className="btn red"   disabled={busy} onClick={() => decide(false)}>Descartar</button>
    </div>
  );
}
