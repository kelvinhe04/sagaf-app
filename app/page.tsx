import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (!session.user.mfaVerified) redirect('/mfa/verify');

  switch (session.user.rol) {
    case 'sujeto_obligado': redirect('/portal');
    case 'analista':
    case 'supervisor':      redirect('/uaf');
    case 'auditor':         redirect('/auditor');
    case 'admin':           redirect('/admin');
    default:                redirect('/login');
  }
}
