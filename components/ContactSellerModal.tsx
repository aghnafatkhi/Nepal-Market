'use client';

import React, { useState } from 'react';
import { X, MessageCircle, Instagram, Phone, Copy, Check, ExternalLink } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onTrackContact?: () => void;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  product,
  onTrackContact,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const seller = product.seller;
  const rawPhone = seller.whatsapp || '';
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
  const instagramHandle = (seller.instagram || '').replace(/^@/, '');

  const defaultWaMessage = `Halo, saya melihat barang '${product.title}' di Nepal Market. Apakah masih ada?`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWaMessage)}`;
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null;

  const handleCopyPhone = () => {
    onTrackContact?.();
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div
      id="contact-seller-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      onClick={onClose}
    >
      <div
        id="contact-seller-modal-content"
        className="w-full max-w-md bg-white rounded-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hubungi Penjual</h3>
            <p className="text-xs text-slate-500 mt-0.5">Penjual: {seller.name}</p>
          </div>
          <button
            id="btn-close-contact-modal"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {seller.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {seller.name}
              </div>
              <div className="text-xs text-slate-500">
                Lokasi COD: {product.location}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Negosiasi harga dan kesepakatan tempat COD dilakukan langsung antara kamu dan penjual.
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Opsi WhatsApp */}
            {rawPhone && <a
              id="link-contact-whatsapp"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTrackContact}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md font-medium text-sm transition-colors group min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-80 group-hover:opacity-100" />
            </a>}

            {/* Opsi Instagram jika ada */}
            {instagramUrl && (
              <a
                id="link-contact-instagram"
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onTrackContact}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-sm transition-colors group min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4" />
                  <span>Kirim Pesan via Instagram (@{instagramHandle})</span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            )}

            {/* Salin Nomor HP/WA */}
            {rawPhone && <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 px-3 py-2 bg-slate-100 rounded-md text-xs font-mono text-slate-700 truncate border border-slate-200">
                {rawPhone}
              </div>
              <button
                id="btn-copy-seller-phone"
                type="button"
                onClick={handleCopyPhone}
                className="px-3 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>}
            {!rawPhone && !instagramUrl && <p className="text-sm text-slate-600">Penjual belum mencantumkan kontak langsung.</p>}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer min-h-[44px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
