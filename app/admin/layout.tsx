import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar, type NavItem } from '@/components/Sidebar';
import { LayoutDashboard, Users, Building2, FileText } from 'lucide-react';

const navItems: NavItem[] = [
  { href: '/admin',                    label: 'Resumen',             icon: <LayoutDashboard size={16} /> },
  { href: '/admin/usuarios',           label: 'Usuarios y roles',    icon: <Users size={16} /> },
  { href: '/admin/sujetos-obligados',  label: 'Sujetos obligados',   icon: <Building2 size={16} /> },
  { href: '/admin/plantillas',         label: 'Plantillas ROS',      icon: <FileText size={16} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.rol !== 'admin') redirect('/');

  return (
    <div className="app">
      <Sidebar
        role="admin"
        userName={session.user.name ?? 'Admin'}
        navItems={navItems}
        note="Como administrador NO tienes acceso libre al contenido sensible de los ROS (RNF-02). Tus acciones quedan auditadas."
      />
      <main className="main">{children}</main>
    </div>
  );
}
