import { auth } from '@/auth';
import { headers } from 'next/headers';
import { TopBar } from '@/components/TopBar';
import { KpiCard } from '@/components/KpiCard';
import { AuditTable } from '@/components/AuditTable';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';

interface SP {
  q?: string; modulo?: string; resultado?: string; criticidad?: string; desde?: string; hasta?: string;
}

export default async function AuditorHome({ searchParams }: { searchParams: Promise<SP> }) {
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

  // CU-03 · auditoría de la auditoría
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

  const total       = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM evento_auditoria`).get()!.c;
  const fallos      = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM evento_auditoria WHERE resultado = 'fallo'`).get()!.c;
  const criticos    = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM evento_auditoria WHERE criticidad = 'critica'`).get()!.c;
  const mfaFails    = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM evento_auditoria WHERE accion = 'mfa_verify_failed'`).get()!.c;

  const userInitials = (session!.user.name ?? 'AU').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        eyebrow="CU-03 · Auditor interno"
        title="Auditoría del sistema SAGAF"
        description="Acceso de solo lectura al log inmutable de eventos. No tienes acceso a contenido de ROS, solo a las acciones que se realizaron sobre ellos."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge="Acceso de solo lectura"
      />

      <div className="kpis">
        <KpiCard label="Eventos totales" value={total} badge="Histórico" tone="blue" />
        <KpiCard label="Eventos con fallo" value={fallos} badge="Revisar" tone="amber" />
        <KpiCard label="Eventos críticos" value={criticos} badge="Atención" tone="red" />
        <KpiCard label="Fallos MFA" value={mfaFails} badge="Seguridad" tone="purple" />
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h3>Eventos de auditoría</h3>
            <p>Log inmutable · hora del servidor · trigger ABORT a nivel de BD.</p>
          </div>
        </div>
        <AuditTable filters={filters} />
      </div>
    </>
  );
}
