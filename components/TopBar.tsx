import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  userInitials: string;
  userName: string;
  userBadge?: string;
  right?: ReactNode;
}

export function TopBar({ eyebrow, title, description, userInitials, userName, userBadge, right }: Props) {
  return (
    <div className="topbar">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {description && <p className="lead">{description}</p>}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {right}
        <div className="user-chip">
          <div className="avatar">{userInitials}</div>
          <div>
            <strong>{userName}</strong>
            <div className="small">{userBadge ?? 'MFA activo'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
