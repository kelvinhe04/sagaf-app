import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar, type NavItem } from '@/components/Sidebar';

const navItems: NavItem[] = [
  { href: '/portal',                label: 'Inicio',            icon: '🏠' },
  { href: '/portal/ros',            label: 'Mis ROS',           icon: '📋' },
  { href: '/portal/ros/nuevo',      label: 'Registrar ROS',     icon: '➕' },
  { href: '/portal/subsanaciones',  label: 'Subsanaciones',     icon: '🔁' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.rol !== 'sujeto_obligado') redirect('/');

  return (
    <div className="app">
      <Sidebar
        role="sujeto_obligado"
        userName={session.user.name ?? session.user.email ?? 'Sujeto obligado'}
        navItems={navItems}
        note="Portal público autenticado con MFA. Cada documento se carga en su propio contenedor (RF-07). La cédula se valida sin exponer datos personales (RF-06)."
      />
      <main className="main">{children}</main>
    </div>
  );
}
