import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar, type NavItem } from '@/components/Sidebar';

const navItems: NavItem[] = [
  { href: '/auditor', label: 'Auditoría',  icon: '🛡️' },
];

export default async function AuditorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.rol !== 'auditor') redirect('/');

  return (
    <div className="app">
      <Sidebar
        role="auditor"
        userName={session.user.name ?? 'Auditor'}
        navItems={navItems}
        note="Acceso solo lectura al log de auditoría. No tienes acceso al contenido de los ROS (RNF-02). Cada consulta queda registrada como evento."
      />
      <main className="main">{children}</main>
    </div>
  );
}
