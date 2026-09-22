'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crop, Loader2, X } from 'lucide-react';

interface ProductImageCropModalProps {
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

const OUTPUT_SIZE = 1400;

export function ProductImageCropModal({ file, onCancel, onConfirm }: ProductImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const drawPreview = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const size = canvas.width;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (width - size) / 2);
    const maxOffsetY = Math.max(0, (height - size) / 2);
    const x = (size - width) / 2 + (positionX / 100) * maxOffsetX;
    const y = (size - height) / 2 + (positionY / 100) * maxOffsetY;

    context.clearRect(0, 0, size, size);
    context.drawImage(image, x, y, width, height);
  };

  useEffect(() => {
    if (!file) return;
    setZoom(1);
    setPositionX(0);
    setPositionY(0);

    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      imageRef.current = image;
      drawPreview();
    };
    image.src = url;

    return () => {
      URL.revokeObjectURL(url);
      imageRef.current = null;
    };
    // drawPreview intentionally reads the newly loaded image through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, positionX, positionY]);

  if (!file) return null;

  const handleConfirm = async () => {
    const sourceCanvas = canvasRef.current;
    const image = imageRef.current;
    if (!sourceCanvas || !image) return;
    setIsSaving(true);

    const output = document.createElement('canvas');
    output.width = OUTPUT_SIZE;
    output.height = OUTPUT_SIZE;
    const context = output.getContext('2d');
    if (!context) {
      setIsSaving(false);
      return;
    }

    const baseScale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (width - OUTPUT_SIZE) / 2);
    const maxOffsetY = Math.max(0, (height - OUTPUT_SIZE) / 2);
    const x = (OUTPUT_SIZE - width) / 2 + (positionX / 100) * maxOffsetX;
    const y = (OUTPUT_SIZE - height) / 2 + (positionY / 100) * maxOffsetY;
    context.drawImage(image, x, y, width, height);

    output.toBlob((blob) => {
      if (!blob) {
        setIsSaving(false);
        return;
      }
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto-produk';
      onConfirm(new File([blob], `${baseName}-crop.webp`, { type: 'image/webp' }));
      setIsSaving(false);
    }, 'image/webp', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-3" role="dialog" aria-modal="true" aria-label="Potong foto produk">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Atur Foto Produk</h2>
            <p className="text-xs text-slate-500">Foto akan disimpan dalam rasio 1:1 agar tidak terpotong lagi.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Batalkan crop">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <canvas ref={canvasRef} width={420} height={420} className="aspect-square w-full rounded-lg bg-slate-100" />

          <label className="block text-xs font-semibold text-slate-700">
            Perbesar
            <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-1 w-full" />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Geser horizontal
            <input type="range" min="-100" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} className="mt-1 w-full" />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Geser vertikal
            <input type="range" min="-100" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} className="mt-1 w-full" />
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} disabled={isSaving} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Lewati Foto</button>
            <button type="button" onClick={handleConfirm} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}
              Gunakan Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
