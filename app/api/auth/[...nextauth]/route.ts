// app/api/auth/[...nextauth]/route.ts — Endpoints HTTP de NextAuth v5
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
