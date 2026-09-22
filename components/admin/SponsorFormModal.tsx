'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Globe,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { DbSponsorBanner, DbSponsorBannerStatus } from '@/lib/supabase/types';
import {
  CreateSponsorBannerInput,
  uploadSponsorBannerImage,
  validateSponsorImageFile,
  PROHIBITED_SPONSOR_GUIDELINES,
} from '@/lib/supabase/sponsors';

interface SponsorFormModalProps {
  isOpen: boolean;
  sponsorToEdit: DbSponsorBanner | null;
  onClose: () => void;
  onSave: (payload: CreateSponsorBannerInput, id?: string) => Promise<boolean>;
}

export const SponsorFormModal: React.FC<SponsorFormModalProps> = ({
  isOpen,
  sponsorToEdit,
  onClose,
  onSave,
}) => {
  // Form State
  const [sponsorName, setSponsorName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [status, setStatus] = useState<DbSponsorBannerStatus>('active');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  // Image upload states
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [desktopProgress, setDesktopProgress] = useState<number>(0);

  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string>('');
  const [mobileProgress, setMobileProgress] = useState<number>(0);

  // Submit & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File input refs
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Reset or Populate form on open/change
  useEffect(() => {
    if (!isOpen) return;

    if (sponsorToEdit) {
      setSponsorName(sponsorToEdit.sponsor_name || '');
      setTargetUrl(sponsorToEdit.target_url || '');
      setAltText(sponsorToEdit.alt_text || '');
      setStatus(sponsorToEdit.status || 'active');
      setSortOrder(sponsorToEdit.sort_order ?? 0);

      // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
      setStartsAt(sponsorToEdit.starts_at ? sponsorToEdit.starts_at.substring(0, 16) : '');
      setEndsAt(sponsorToEdit.ends_at ? sponsorToEdit.ends_at.substring(0, 16) : '');

      setDesktopFile(null);
      setDesktopPreview(sponsorToEdit.desktop_image_url || '');
      setDesktopProgress(0);

      setMobileFile(null);
      setMobilePreview(sponsorToEdit.mobile_image_url || '');
      setMobileProgress(0);
    } else {
      setSponsorName('');
      setTargetUrl('https://');
      setAltText('');
      setStatus('active');
      setSortOrder(0);
      setStartsAt('');
      setEndsAt('');

      setDesktopFile(null);
      setDesktopPreview('');
      setDesktopProgress(0);

      setMobileFile(null);
      setMobilePreview('');
      setMobileProgress(0);
    }

    setFormError(null);
    setIsSubmitting(false);
  }, [isOpen, sponsorToEdit]);

  // Clean up object URLs on unmount/change
  useEffect(() => {
    return () => {
      if (desktopPreview && desktopPreview.startsWith('blob:')) {
        URL.revokeObjectURL(desktopPreview);
      }
      if (mobilePreview && mobilePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mobilePreview);
      }
    };
  }, [desktopPreview, mobilePreview]);

  if (!isOpen) return null;

  // Handle Desktop File Pick
  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSponsorImageFile(file);
    if (!validation.valid) {
      setFormError(validation.error || 'File desktop tidak valid.');
      return;
    }

    setFormError(null);
    setDesktopFile(file);
    const objectUrl = URL.createObjectURL(file);
    setDesktopPreview(objectUrl);
  };

  // Handle Mobile File Pick
  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSponsorImageFile(file);
    if (!validation.valid) {
      setFormError(validation.error || 'File mobile tidak valid.');
      return;
    }

    setFormError(null);
    setMobileFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMobilePreview(objectUrl);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation
    if (!sponsorName.trim()) {
      setFormError('Nama sponsor wajib diisi.');
      return;
    }

    if (!targetUrl.trim() || !/^https:\/\//i.test(targetUrl.trim())) {
      setFormError('URL tujuan wajib diisi dan harus menggunakan protokol HTTPS (misal: https://...)');
      return;
    }

    if (!altText.trim()) {
      setFormError('Alt text gambar wajib diisi untuk standar aksesibilitas.');
      return;
    }

    if (startsAt && endsAt) {
      if (new Date(endsAt) <= new Date(startsAt)) {
        setFormError('Tanggal & waktu berakhir harus lebih akhir daripada tanggal mulai.');
        return;
      }
    }

    if (sortOrder < 0) {
      setFormError('Urutan tampil tidak boleh negatif.');
      return;
    }

    // Periksa gambar
    let finalDesktopUrl = desktopPreview;
    let finalMobileUrl = mobilePreview;

    if (!sponsorToEdit) {
      if (!desktopFile) {
        setFormError('Silakan pilih file gambar banner desktop.');
        return;
      }
      if (!mobileFile) {
        setFormError('Silakan pilih file gambar banner mobile.');
        return;
      }
    } else {
      if (!finalDesktopUrl) {
        setFormError('Gambar banner desktop tidak boleh kosong.');
        return;
      }
      if (!finalMobileUrl) {
        setFormError('Gambar banner mobile tidak boleh kosong.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload desktop image jika ada file baru yang dipilih
      if (desktopFile) {
        setDesktopProgress(10);
        const uploadRes = await uploadSponsorBannerImage(desktopFile, 'desktop', (pct) => {
          setDesktopProgress(pct);
        });

        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error?.message || 'Gagal mengunggah banner desktop.');
        }
        finalDesktopUrl = uploadRes.url;
      }

      // Upload mobile image jika ada file baru yang dipilih
      if (mobileFile) {
        setMobileProgress(10);
        const uploadRes = await uploadSponsorBannerImage(mobileFile, 'mobile', (pct) => {
          setMobileProgress(pct);
        });

        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error?.message || 'Gagal mengunggah banner mobile.');
        }
        finalMobileUrl = uploadRes.url;
      }

      // Payload final
      const payload: CreateSponsorBannerInput = {
        sponsor_name: sponsorName.trim(),
        target_url: targetUrl.trim(),
        alt_text: altText.trim(),
        status,
        sort_order: Number(sortOrder) || 0,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        desktop_image_url: finalDesktopUrl,
        mobile_image_url: finalMobileUrl,
      };

      const success = await onSave(payload, sponsorToEdit?.id);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Terjadi kesalahan saat menyimpan data sponsor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="sponsor-form-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        id="sponsor-form-modal-content"
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/90">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {sponsorToEdit ? 'Edit Banner Sponsor' : 'Tambah Banner Sponsor Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              Lengkapi informasi sponsor, unggah aset banner desktop & mobile, dan atur jadwal tayang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
            aria-label="Tutup form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6 flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 1: INFORMASI SPONSOR & TAUTAN */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Informasi Sponsor & Tautan
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sponsor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Misal: Kopi Kenangan Kampus Nepal"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>URL Tujuan (Wajib HTTPS) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Link akan dibuka di tab baru dengan rel=&quot;sponsored&quot;.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alt Text Gambar <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Deskripsi singkat gambar untuk aksesibilitas"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: GAMBAR BANNER DESKTOP */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Banner Layar Desktop & Tablet
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Rasio 5:1 (Rekomendasi 1500 × 300)
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={desktopInputRef}
                accept=".jpg,.jpeg,.png,.webp,.avif"
                onChange={handleDesktopFileChange}
                className="hidden"
              />

              {/* Preview Box */}
              {desktopPreview ? (
                <div className="relative w-full aspect-[5/1] bg-slate-100 rounded-lg border border-slate-300 overflow-hidden group">
                  <Image
                    src={desktopPreview}
                    alt="Preview Desktop"
                    fill
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => desktopInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-md bg-white text-slate-900 text-xs font-semibold shadow-sm hover:bg-slate-100"
                    >
                      Ganti Gambar Desktop
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                    Desktop 5:1
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => desktopInputRef.current?.click()}
                  className="w-full aspect-[5/1] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Klik untuk pilih gambar Desktop
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG, WebP, AVIF — Maksimal 5 MB
                  </p>
                </div>
              )}

              {desktopProgress > 0 && desktopProgress < 100 && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
                    style={{ width: `${desktopProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: GAMBAR BANNER MOBILE */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Banner Layar Mobile
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Rasio 8:3 (Rekomendasi 1200 × 450)
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={mobileInputRef}
                accept=".jpg,.jpeg,.png,.webp,.avif"
                onChange={handleMobileFileChange}
                className="hidden"
              />

              {/* Preview Box */}
              {mobilePreview ? (
                <div className="relative w-full max-w-xs aspect-[8/3] bg-slate-100 rounded-lg border border-slate-300 overflow-hidden group">
                  <Image
                    src={mobilePreview}
                    alt="Preview Mobile"
                    fill
                    sizes="320px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => mobileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-md bg-white text-slate-900 text-[11px] font-semibold shadow-sm hover:bg-slate-100"
                    >
                      Ganti Gambar Mobile
                    </button>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                    Mobile 8:3
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => mobileInputRef.current?.click()}
                  className="w-full max-w-xs aspect-[8/3] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Klik untuk pilih gambar Mobile
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG, WebP, AVIF — Maksimal 5 MB
                  </p>
                </div>
              )}

              {mobileProgress > 0 && mobileProgress < 100 && (
                <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
                    style={{ width: `${mobileProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: STATUS, URUTAN, & JADWAL */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Status, Urutan, & Jadwal Tayang
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Banner
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DbSponsorBannerStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="active">Aktif (Ditayangkan jika masuk jadwal)</option>
                  <option value="draft">Draft (Disimpan tanpa ditayangkan)</option>
                  <option value="inactive">Nonaktif (Dihentikan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urutan Tampil (Sort Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-xs px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Angka lebih kecil tampil lebih awal (misal: 0, 10, 20).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mulai Tayang (Opsional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kosongkan jika ingin langsung tayang.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Berakhir Tayang (Opsional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kosongkan jika tayang tanpa batas akhir.
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: KEPATUHAN LARANGAN MATERI SPONSOR */}
          {/* ========================================================= */}
          <div className="space-y-3 p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl">
            <div className="flex items-center gap-2 pb-1 border-b border-rose-200/60">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Pedoman Larangan Materi Konten Sponsor (7 Ketentuan)</span>
              </h3>
            </div>

            <p className="text-[11px] text-rose-700 leading-relaxed">
              Materi iklan wajib menaati nilai edukatif dan etika komunitas sekolah. Dilarang memuat:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PROHIBITED_SPONSOR_GUIDELINES.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-white/80 border border-rose-200/70 text-[11px] space-y-0.5"
                >
                  <span className="font-bold text-rose-900 block">
                    {idx + 1}. {item.title}
                  </span>
                  <p className="text-slate-600 text-[10px] leading-snug">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sponsorToEdit ? 'Simpan Perubahan' : 'Tambah Sponsor'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
