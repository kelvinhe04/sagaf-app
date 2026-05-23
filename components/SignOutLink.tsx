'use client';
import { signOut } from 'next-auth/react';

export function SignOutLink({ label = 'Cancelar y cerrar sesión' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        marginTop: 14,
        color: '#667085',
        cursor: 'pointer',
        fontSize: 13,
        textDecoration: 'underline',
      }}
    >
      ← {label}
    </button>
  );
}
