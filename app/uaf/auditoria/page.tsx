import { auth } from '@/auth';
import { TopBar } from '@/components/TopBar';
import { AuditTable } from '@/components/AuditTable';
import { audit, extractRequestContext } from '@/lib/audit';
import { headers } from 'next/headers';

interface SP {
  q?: string; modulo?: string; resultado?: string; criticidad?: string; desde?: string; hasta?: string;
}

export default async function UafAuditoriaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  const sp = await searchParams;
  const filters = {
    q: sp.q ?? '',
    modulo: sp.modulo ?? '',
    resultado: sp.resultado ?? '',
    criticidad: sp.criticidad ?? '',
    desde: sp.desde ?? '',
    hasta: sp.hasta ?? '',
  };

  // CU-03 RE-03: la consulta al log queda auditada
  const h = await headers();
  audit({
    modulo: 'auditoria',
    accion: 'consulta_log',
    resultado: 'exito',
    usuario_id: session!.user.id,
    usuario_correo: session!.user.email,
    rol: session!.user.rol,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip'),
    user_agent: h.get('user-agent'),
    detalle: filters,
  });

  const userInitials = (session!.user.name ?? 'UA').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        eyebrow="Trazabilidad y auditoría"
        title="Historial de auditoría del sistema"
        description="Log inmutable de acciones realizadas en SAGAF. La consulta a este log también queda registrada."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge="MFA activo · Acceso por caso"
      />

      <div className="card">
        <AuditTable filters={filters} />
      </div>
    </>
  );
}
