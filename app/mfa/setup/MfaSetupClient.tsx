'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Props { userEmail: string }

export function MfaSetupClient({ userEmail }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/mfa/setup', { method: 'POST' });
      const data = await res.json();
      if (!cancelled && res.ok) {
        setQr(data.qr);
        setSecret(data.secret);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onConfirm(e: React.FormEvent) {
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
      await update({ mfaVerified: true });
      router.replace('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr', alignItems: 'start' }}>
        <div className="qr-box">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Código QR para enrolamiento MFA" width={240} height={240} />
          ) : (
            <div style={{ padding: 24, color: '#667085' }}>Generando QR…</div>
          )}
        </div>

        {secret && (
          <div className="info-box">
            <span>Clave manual</span>
            <strong style={{ fontFamily: 'Consolas, monospace', fontSize: 13, wordBreak: 'break-all' }}>
              {secret}
            </strong>
            <div className="helper" style={{ marginTop: 6 }}>
              Si tu app no puede escanear el QR, ingresa esta clave manualmente.
              Cuenta: <code>{userEmail}</code>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onConfirm} style={{ marginTop: 18 }}>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="code">Código generado por tu autenticador</label>
            <input
              id="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="code-input"
              placeholder="000000"
              required
            />
          </div>
          {error && (
            <div className="client-status error" style={{ gridColumn: '1 / -1' }}>{error}</div>
          )}
          <div className="field full">
            <button className="btn primary" disabled={loading || code.length !== 6} style={{ width: '100%' }}>
              {loading ? 'Verificando…' : 'Confirmar y entrar'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
