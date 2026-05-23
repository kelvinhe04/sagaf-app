'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function MfaVerifyForm() {
  const router = useRouter();
  const { update } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Código inválido');
        return;
      }
      // Marca la sesión como mfaVerified=true y navega al landing
      await update({ mfaVerified: true });
      router.replace('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="code">Código de 6 dígitos</label>
          <input
            id="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="code-input"
            placeholder="000000"
            autoFocus
            required
          />
        </div>
        {error && (
          <div className="client-status error" style={{ gridColumn: '1 / -1' }}>
            {error}
          </div>
        )}
        <div className="field full">
          <button className="btn primary" type="submit" disabled={loading || code.length !== 6} style={{ width: '100%' }}>
            {loading ? 'Verificando…' : 'Validar acceso'}
          </button>
        </div>
      </div>

      <div className="notice" style={{ marginTop: 14, fontSize: 12.5 }}>
        El código TOTP rota cada 30 segundos. Si tu reloj está desincronizado, podría fallar (DEF-01).
        Esta verificación es obligatoria por RNF-01 / Ley 23/2015.
      </div>
    </form>
  );
}
