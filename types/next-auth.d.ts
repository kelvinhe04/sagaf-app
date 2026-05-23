// types/next-auth.d.ts — Extiende las interfaces de NextAuth con los campos de SAGAF
import type { Role } from '@/types';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    rol: Role;
    sujetoObligadoId: string | null;
    mfaActivo: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      rol: Role;
      sujetoObligadoId: string | null;
      mfaActivo: boolean;
      mfaVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol: Role;
    sujetoObligadoId: string | null;
    mfaActivo: boolean;
    mfaVerified: boolean;
  }
}
