'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export function SignOutLink({ label = 'Cancelar y cerrar sesión' }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', top: 24, left: 24, zIndex: 50 }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '9px 16px',
          color: '#475569',
          fontSize: 13.5,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          transition: 'box-shadow 0.15s, background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          const t = e.currentTarget;
          t.style.background = '#f8fafc';
          t.style.color = '#0f172a';
          t.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={e => {
          const t = e.currentTarget;
          t.style.background = 'white';
          t.style.color = '#475569';
          t.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)';
        }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        {label}
      </button>

      <ConfirmModal
        isOpen={open}
        variant="warning"
        title="¿Cancelar y cerrar sesión?"
        message="Se descartará cualquier progreso no guardado y se cerrará tu sesión activa."
        confirmLabel="Sí, cerrar sesión"
        cancelLabel="Volver"
        onConfirm={() => signOut({ callbackUrl: '/login' })}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
