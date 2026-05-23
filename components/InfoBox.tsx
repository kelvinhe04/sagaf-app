import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  style?: React.CSSProperties;
}

export function InfoBox({ label, value, style }: Props) {
  return (
    <div className="info-box" style={style}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
