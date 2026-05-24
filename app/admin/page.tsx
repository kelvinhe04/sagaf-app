import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { KpiCard } from '@/components/KpiCard';
import { Users, Building2, FileText } from 'lucide-react';

export default async function AdminHome() {
  const session = await auth();

  const usuarios = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM usuario`).get()!.c;
  const sujetos  = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM sujeto_obligado`).get()!.c;
  const plantillas = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM plantilla_ros`).get()!.c;
  const mfaPendiente = db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM usuario WHERE mfa_activo = 0`).get()!.c;

  const userInitials = (session!.user.name ?? 'AD').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <TopBar
        eyebrow="Administración SAGAF"
        title="Panel general"
        description="Gestiona usuarios, roles, sujetos obligados y plantillas. El rol de administrador no tiene acceso al contenido sensible de los ROS."
        userInitials={userInitials}
        userName={session!.user.name ?? ''}
        userBadge="Administrador · MFA activo"
      />

      <div className="kpis">
        <KpiCard label="Usuarios"        value={usuarios}      badge="Total"     tone="blue" />
        <KpiCard label="Sujetos obligados" value={sujetos}     badge="Activos"   tone="teal" />
        <KpiCard label="Plantillas ROS"  value={plantillas}    badge="Sector"    tone="green" />
        <KpiCard label="Sin MFA enrolado" value={mfaPendiente} badge="Atención"  tone="amber" />
      </div>

      <div className="card">
        <h3 style={{ margin: 0 }}>Acciones rápidas</h3>
        <p className="small" style={{ marginBottom: 14 }}>Atajos a las áreas administrativas más usadas.</p>
        <div className="action-row">
          <a href="/admin/usuarios"          className="btn primary"><Users size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Gestionar usuarios</a>
          <a href="/admin/sujetos-obligados" className="btn teal"><Building2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Gestionar sujetos obligados</a>
          <a href="/admin/plantillas"        className="btn ghost"><FileText size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Ver plantillas ROS</a>
        </div>
      </div>
    </>
  );
}
