'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, ExternalLink, Calendar, Globe, Layers, Eye } from 'lucide-react';
import { DbSponsorBanner } from '@/lib/supabase/types';
import { getSponsorScheduleStatus } from '@/lib/supabase/sponsors';
import { AdminStatusBadge } from './AdminStatusBadge';

interface SponsorPreviewModalProps {
  banner: DbSponsorBanner | null;
  onClose: () => void;
}

export const SponsorPreviewModal: React.FC<SponsorPreviewModalProps> = ({
  banner,
  onClose,
}) => {
  useEffect(() => {
    if (!banner) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [banner, onClose]);

  if (!banner) return null;

  const scheduleStatus = getSponsorScheduleStatus(banner);

  return (
    <div
      id="sponsor-preview-dialog-portal"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="sponsor-preview-dialog-content"
        className="w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pratinjau Banner Sponsor
              </h3>
              <p className="text-xs text-slate-500">
                Tampilan banner di layar desktop dan mobile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            aria-label="Tutup pratinjau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Nama Sponsor</span>
              <span className="font-bold text-slate-900 text-sm">{banner.sponsor_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <AdminStatusBadge
                status={banner.status}
                label={banner.status === 'active' ? 'Status: Aktif' : banner.status === 'draft' ? 'Status: Draft' : 'Status: Nonaktif'}
              />
              <AdminStatusBadge
                status={scheduleStatus}
                label={
                  scheduleStatus === 'live'
                    ? 'Sedang Tayang'
                    : scheduleStatus === 'scheduled'
                    ? 'Terjadwal'
                    : scheduleStatus === 'ended'
                    ? 'Berakhir'
                    : scheduleStatus === 'draft'
                    ? 'Draft'
                    : 'Nonaktif'
                }
              />
            </div>
          </div>

          {/* Preview yang sama untuk seluruh ukuran layar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Banner Semua Layar (Rasio 5:1 — Rekomendasi 1500 × 300)
              </span>
              <span className="text-[11px] text-slate-400">Desktop, tablet, dan mobile</span>
            </div>
            <div className="relative w-full aspect-[5/1] bg-slate-100 rounded-lg border border-slate-300 overflow-hidden shadow-xs">
              <Image
                src={banner.desktop_image_url}
                alt={banner.alt_text || banner.sponsor_name}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium tracking-wide">
                Iklan
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                URL Tujuan Sponsor:
              </span>
              <a
                href={banner.target_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-blue-600 hover:text-blue-700 underline font-mono break-all inline-flex items-center gap-1"
              >
                <span>{banner.target_url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Alt Text:
              </span>
              <p className="text-slate-800 font-medium">{banner.alt_text}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Jadwal Tayang:
              </span>
              <p className="text-slate-800 font-mono text-[11px]">
                {banner.starts_at ? new Date(banner.starts_at).toLocaleString('id-ID') : 'Tanpa batas awal'}
                {' s/d '}
                {banner.ends_at ? new Date(banner.ends_at).toLocaleString('id-ID') : 'Selamanya'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Urutan Prioritas (Sort Order):</span>
              <p className="text-slate-800 font-semibold font-mono">{banner.sort_order}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            ID: {banner.id}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={banner.target_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              <span>Uji Tautan Sponsor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
