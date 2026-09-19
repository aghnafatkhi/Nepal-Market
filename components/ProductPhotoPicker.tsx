'use client';

import { useEffect, useState } from 'react';

type Props = { files: File[]; onChange: (files: File[]) => void };
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export function ProductPhotoPicker({ files, onChange }: Props) {
  const [error, setError] = useState('');

  return (
    <div>
      <label htmlFor="product-photos" className="block text-sm font-medium text-slate-700 mb-1">Foto barang (1–5) *</label>
      <input
        id="product-photos"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          const incoming = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length + incoming.length > 5) {
            setError('Maksimal 5 foto.');
            return;
          }
          if (incoming.some((file) => !acceptedTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
            setError('Gunakan JPG, PNG, atau WebP; maksimal 5 MB per foto.');
            return;
          }
          setError('');
          onChange([...files, ...incoming]);
        }}
        className="block w-full min-h-11 rounded-lg border border-slate-200 p-2 text-sm"
        aria-describedby="photo-help photo-error"
      />
      <p id="photo-help" className="mt-1 text-xs text-slate-500">Foto pertama menjadi sampul. JPG, PNG, atau WebP, maksimal 5 MB per foto.</p>
      {error && <p id="photo-error" role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="relative">
              <PhotoPreview file={file} index={index} />
              <button type="button" onClick={() => onChange(files.filter((_, i) => i !== index))} aria-label={`Hapus foto ${index + 1}`} className="mt-1 min-h-11 w-full rounded-lg border text-xs">Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoPreview({ file, index }: { file: File; index: number }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result ?? ''));
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Foto barang ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />
  ) : <div className="aspect-square rounded-lg bg-slate-100" />;
}
