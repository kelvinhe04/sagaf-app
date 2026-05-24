import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar, type NavItem } from '@/components/Sidebar';
import { Home, ClipboardList, FilePlus, RefreshCw } from 'lucide-react';

const navItems: NavItem[] = [
  { href: '/portal',                label: 'Inicio',            icon: <Home size={16} /> },
  { href: '/portal/ros',            label: 'Mis ROS',           icon: <ClipboardList size={16} /> },
  { href: '/portal/ros/nuevo',      label: 'Registrar ROS',     icon: <FilePlus size={16} /> },
  { href: '/portal/subsanaciones',  label: 'Subsanaciones',     icon: <RefreshCw size={16} /> },
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
