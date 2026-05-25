import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  right?: ReactNode;
}

export function TopBar({ eyebrow, title, description, right }: Props) {
  return (
    <div className="topbar">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {description && <p className="lead">{description}</p>}
      </div>
      {right && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{right}</div>}
    </div>
  );
}
