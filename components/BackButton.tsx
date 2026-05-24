'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface Props {
  href?: string;
  label?: string;
}

export function BackButton({ href, label = 'Regresar' }: Props) {
  const router = useRouter();
  return (
    <button
      className="btn back-btn"
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
    >
      <ChevronLeft size={15} />
      {label}
    </button>
  );
}
