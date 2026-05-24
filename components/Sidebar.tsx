'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import type { Role } from '@/types';
import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  role: Role;
  userName: string;
  navItems: NavItem[];
  note?: string;
}

export function Sidebar({ role, userName, navItems, note }: Props) {
  const path = usePathname();
  const roleLabel: Record<Role, string> = {
    sujeto_obligado: 'Portal del Sujeto Obligado',
    analista:        'Sistema interno UAF',
    supervisor:      'Sistema interno UAF · Supervisión',
    auditor:         'Auditor Interno',
    admin:           'Administración SAGAF',
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">SG</div>
        <div>
          <h1>SAGAF</h1>
          <span>{roleLabel[role]}</span>
        </div>
      </div>

      <div className="side-title">Navegación</div>
      <nav className="nav">
        {navItems.map((item) => {
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
              <span style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="side-title">Sesión</div>
      <div className="nav">
        <button type="button" onClick={() => signOut({ callbackUrl: '/login' })}>
          <span style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}><LogOut size={16} /></span>
          Cerrar sesión
        </button>
      </div>

      <div className="side-note">
        <strong style={{ color: 'white', display: 'block', marginBottom: 4 }}>{userName}</strong>
        {note ??
          'Esta sesión está protegida por MFA. Todas las acciones quedan registradas en auditoría (RF-03).'}
      </div>
    </aside>
  );
}
