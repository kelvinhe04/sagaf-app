import { auth } from '@/auth';
import { db } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { KpiCard } from '@/components/KpiCard';

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
        description="Gestiona usuarios, roles, sujetos obligados y plantillas. Tu acceso está limitado por RNF-02: NO accedes al contenido sensible de ROS."
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
          <a href="/admin/usuarios"          className="btn primary">👥 Gestionar usuarios</a>
          <a href="/admin/sujetos-obligados" className="btn teal">🏢 Gestionar sujetos obligados</a>
          <a href="/admin/plantillas"        className="btn ghost">📄 Ver plantillas ROS</a>
        </div>
      </div>
    </>
  );
}
