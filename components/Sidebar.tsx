'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, X } from 'lucide-react';
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
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, userName, navItems, note, mobileOpen, onClose }: Props) {
  const path = usePathname();
  const roleLabel: Record<Role, string> = {
    sujeto_obligado: 'Portal del Sujeto Obligado',
    analista:        'Sistema interno UAF',
    supervisor:      'Sistema interno UAF · Supervisión',
    auditor:         'Auditor Interno',
    admin:           'Administración SAGAF',
  };

  return (
    <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
      {onClose && (
        <button
          className="sidebar-close"
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      )}

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
          const active = (() => {
            if (path === item.href) return true;
            if (item.href === '/' || !path.startsWith(item.href + '/')) return false;
            // Don't mark parent active if a more-specific nav item already matches
            return !navItems.some(
              (other) =>
                other.href !== item.href &&
                other.href.startsWith(item.href) &&
                (path === other.href || path.startsWith(other.href + '/')),
            );
          })();
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : ''}
              onClick={onClose}
            >
              <span style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="side-title">Sesión</div>
      <div className="nav">
        <button
          type="button"
          className="signout-btn"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <div className="side-note">
        <strong style={{ color: 'white', display: 'block', marginBottom: 4 }}>{userName}</strong>
        {note ??
          'Esta sesión está protegida por autenticación de dos factores. Todas las acciones quedan registradas en auditoría.'}
      </div>
    </aside>
  );
}
