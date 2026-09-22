'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { UploadCloud, X, ArrowLeft, ArrowRight, Star, Loader2 } from 'lucide-react';
import { compressImage, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils/imageCompression';
import { ProductImageCropModal } from '@/components/ProductImageCropModal';

export interface PhotoPickerItem {
  id: string;
  type: 'file' | 'existing';
  file?: File;
  url: string; // URL blob untuk file lokal atau URL publik Supabase
}

interface ProductPhotoPickerProps {
  // Mode sederhana (hanya File[]), cocok untuk form sell baru
  files?: File[];
  onChange?: (files: File[]) => void;
  // Mode serbaguna (File[] + existing URL), cocok untuk form edit
  items?: PhotoPickerItem[];
  onItemsChange?: (items: PhotoPickerItem[]) => void;
  maxPhotos?: number;
  label?: string;
  error?: string | null;
}

export const ProductPhotoPicker: React.FC<ProductPhotoPickerProps> = ({
  files,
  onChange,
  items,
  onItemsChange,
  maxPhotos = 5,
  label = 'Foto Barang (1–5 Foto)',
  error: externalError,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Jika parent menggunakan mode `files`, turunkan dari prop dengan useMemo
  const fileItems = useMemo(() => {
    if (!files) return [];
    return files.map((file, idx) => ({
      id: `file-${file.name}-${file.lastModified}-${idx}`,
      type: 'file' as const,
      file,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      fileItems.forEach((it) => {
        if (it.url.startsWith('blob:')) {
          URL.revokeObjectURL(it.url);
        }
      });
    };
  }, [fileItems]);

  const currentItems = items !== undefined ? items : fileItems;

  const updateItems = (newItems: PhotoPickerItem[]) => {
    if (onItemsChange) {
      onItemsChange(newItems);
    } else if (onChange) {
      const onlyFiles = newItems.filter((it) => it.file).map((it) => it.file as File);
      onChange(onlyFiles);
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setInternalError(null);

    const incoming = Array.from(fileList);
    const availableSlots = maxPhotos - currentItems.length;

    if (availableSlots <= 0) {
      setInternalError(`Maksimal ${maxPhotos} foto barang.`);
      return;
    }

    if (incoming.length > availableSlots) {
      setInternalError(`Hanya bisa menambah ${availableSlots} foto lagi (maksimal ${maxPhotos} foto).`);
    }

    const filesToProcess = incoming.slice(0, availableSlots);

    // Validasi tipe & ukuran file awal
    for (const f of filesToProcess) {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        setInternalError('Format foto harus JPG, PNG, atau WebP.');
        return;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setInternalError(`Foto "${f.name}" melebihi batas 5 MB.`);
        return;
      }
    }

    setCropQueue(filesToProcess);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setIsCompressing(true);
    try {
      const optimizedFile = await compressImage(croppedFile, 1400, 1400, 0.88);
      const newItem: PhotoPickerItem = {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'file',
        file: optimizedFile,
        url: URL.createObjectURL(optimizedFile),
      };
      updateItems([...currentItems, newItem]);
      setCropQueue((queue) => queue.slice(1));
    } catch {
      setInternalError('Terjadi kendala saat memproses foto. Silakan coba lagi.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCropCancel = () => {
    setCropQueue((queue) => queue.slice(1));
  };

  const handleRemove = (index: number) => {
    const itemToRemove = currentItems[index];
    if (itemToRemove && itemToRemove.type === 'file' && itemToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    const filtered = currentItems.filter((_, idx) => idx !== index);
    updateItems(filtered);
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const next = [...currentItems];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    updateItems(next);
  };

  const handleMoveRight = (index: number) => {
    if (index >= currentItems.length - 1) return;
    const next = [...currentItems];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    updateItems(next);
  };

  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const next = [...currentItems];
    const [target] = next.splice(index, 1);
    next.unshift(target);
    updateItems(next);
  };

  const activeError = externalError || internalError;

  return (
    <div className="space-y-2">
      <ProductImageCropModal file={cropQueue[0] || null} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />
      <div className="flex items-center justify-between">
        <label htmlFor="product-photo-upload" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} *
        </label>
        <span className="text-xs font-medium text-slate-500">
          {currentItems.length} / {maxPhotos} foto
        </span>
      </div>

      {/* Hidden native input */}
      <input
        id="product-photo-upload"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={currentItems.length >= maxPhotos || isCompressing}
      />

      {/* Upload trigger button / area */}
      {currentItems.length < maxPhotos && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
          className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[96px] text-center group disabled:opacity-50"
        >
          {isCompressing ? (
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium py-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Mengoptimalkan foto...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Pilih atau Ambil Foto Barang
              </div>
              <p className="text-[11px] text-slate-500">
                JPG, PNG, atau WebP (maksimal 5 MB per foto). Foto pertama menjadi sampul.
              </p>
            </>
          )}
        </button>
      )}

      {/* Tampilan Grid Foto */}
      {currentItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {currentItems.map((item, index) => {
            const isCover = index === 0;

            return (
              <div
                key={item.id}
                className={`relative group rounded-xl overflow-hidden border bg-slate-100 transition-all ${
                  isCover
                    ? 'ring-2 ring-blue-600 border-blue-600 shadow-xs'
                    : 'border-slate-200'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-square w-full">
                  <Image
                    src={item.url}
                    alt={`Foto ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized={item.url.startsWith('blob:')}
                    referrerPolicy="no-referrer"
                  />

                  {/* Badge Sampul */}
                  {isCover && (
                    <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span>SAMPUL</span>
                    </div>
                  )}

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Bar Tombol Kontrol Posisi (Touch-Friendly) */}
                <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveLeft(index)}
                      disabled={index === 0}
                      aria-label="Geser ke kiri"
                      className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Geser posisi ke kiri"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveRight(index)}
                      disabled={index === currentItems.length - 1}
                      aria-label="Geser ke kanan"
                      className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Geser posisi ke kanan"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetAsCover(index)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Jadikan Sampul
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pesan Error Validasi */}
      {activeError && (
        <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
          {activeError}
        </p>
      )}
    </div>
  );
};
