'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Adjunto {
  id: string;
  nombre_archivo: string;
  estado: string;
  observacion: string | null;
  fecha_carga: string;
}

interface Props {
  rosId: string;
  docReqId: string;
  index: number;
  nombre: string;
  adjunto: Adjunto | null;
}

export function ResubmitDocCard({ rosId, docReqId, index, nombre, adjunto }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('ros_id', rosId);
      fd.append('documento_requerido_id', docReqId);
      const res = await fetch('/api/documentos/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? 'Error al subir el documento.');
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  const estado = adjunto?.estado ?? 'pendiente';
  const cardClass =
    estado === 'cargado'   ? 'doc-card uploaded'
  : estado === 'validado'  ? 'doc-card validated'
  : estado === 'observado' ? 'doc-card observed'
  : 'doc-card';

  const badgeTone =
    estado === 'cargado'   ? 'green'
  : estado === 'validado'  ? 'teal'
  : estado === 'observado' ? 'red'
  : 'amber';

  return (
    <div className={cardClass}>
      <div className="doc-top">
        <div className="doc-title">{index}. {nombre}</div>
        <span className={`badge ${badgeTone}`}>{estado}</span>
      </div>
      {adjunto && <div className="file-name">Archivo actual: {adjunto.nombre_archivo}</div>}
      {adjunto?.observacion && (
        <div className="client-status warning">
          <strong>Observación UAF:</strong> {adjunto.observacion}
        </div>
      )}
      <input
        type="file"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
      {err && <div className="client-status error">{err}</div>}
      <div className="helper">
        {adjunto
          ? 'Subir un archivo nuevo reemplazará el actual y reiniciará el estado del documento.'
          : 'Este contenedor está asociado únicamente a este requisito documental.'}
      </div>
    </div>
  );
}
