import clsx from 'clsx';

type Tone = 'default' | 'amber' | 'red' | 'green';

interface Props {
  children: React.ReactNode;
  tone?: Tone;
  style?: React.CSSProperties;
}

export function Notice({ children, tone = 'default', style }: Props) {
  return (
    <div className={clsx('notice', tone !== 'default' && tone)} style={style}>
      {children}
    </div>
  );
}
