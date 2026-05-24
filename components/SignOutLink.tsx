'use client';
import { signOut } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

export function SignOutLink({ label = 'Cancelar y cerrar sesión' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 -ml-3"
      title={label}
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
}
