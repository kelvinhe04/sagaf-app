import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SAGAF — Sistema Automatizado de Gestión de Análisis Financiero',
  description:
    'Portal público y sistema interno UAF para la gestión de Reportes de Operaciones Sospechosas (Ley 23/2015, Ley 81/2019).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
