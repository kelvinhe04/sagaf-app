import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar, type NavItem } from '@/components/Sidebar';
import { Inbox, Link2, BarChart2, ShieldCheck } from 'lucide-react';

const navItems: NavItem[] = [
  { href: '/uaf',           label: 'Bandeja de ROS',          icon: <Inbox size={16} /> },
  { href: '/uaf/vinculos',  label: 'Vínculos detectados',     icon: <Link2 size={16} /> },
  { href: '/uaf/reportes',  label: 'Reportes e inteligencia', icon: <BarChart2 size={16} /> },
  { href: '/uaf/auditoria', label: 'Auditoría del sistema',   icon: <ShieldCheck size={16} /> },
];

export default async function UafLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!['analista', 'supervisor'].includes(session.user.rol)) redirect('/');

  return (
    <div className="app">
      <Sidebar
        role={session.user.rol === 'supervisor' ? 'supervisor' : 'analista'}
        userName={session.user.name ?? 'UAF'}
        navItems={navItems}
        note={session.user.rol === 'supervisor'
          ? 'Rol Supervisor: validas acciones críticas, apruebas cierres y exportas reportes.'
          : 'Rol Analista: revisas, clasificas y solicitas subsanaciones. Toda acción queda auditada (RF-03).'}
      />
      <main className="main">{children}</main>
    </div>
  );
}
