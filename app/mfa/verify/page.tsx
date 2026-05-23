import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { MfaVerifyForm } from './MfaVerifyForm';
import { SignOutLink } from '@/components/SignOutLink';

export default async function MfaVerifyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.mfaVerified) redirect('/');

  const row = db
    .prepare<[string], { mfa_activo: number }>('SELECT mfa_activo FROM usuario WHERE id = ?')
    .get(session.user.id);

  // Primer login: si MFA no está activo, ofrecer enrolamiento
  if (!row || row.mfa_activo === 0) {
    redirect('/mfa/setup');
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ color: '#102a43', marginBottom: 18 }}>
          <div className="brand-icon">SG</div>
          <div>
            <h1>SAGAF · MFA</h1>
            <span style={{ color: '#667085' }}>Segundo factor obligatorio</span>
          </div>
        </div>

        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Verificación MFA</h1>
        <p className="lead" style={{ marginBottom: 18 }}>
          Ingrese el código de 6 dígitos generado por su aplicación autenticadora
          (Google Authenticator, Microsoft Authenticator, Authy).
        </p>

        <MfaVerifyForm />
        <SignOutLink />
      </div>
    </div>
  );
}
