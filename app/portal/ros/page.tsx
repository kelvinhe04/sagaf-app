import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Alias hacia el dashboard, donde ya se lista de forma completa
export default async function PortalRosList() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  redirect('/portal');
}
