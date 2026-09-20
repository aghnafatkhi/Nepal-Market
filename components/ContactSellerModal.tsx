'use client';

import React, { useState } from 'react';
import { X, MessageCircle, Instagram, Phone, Copy, Check, ExternalLink } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const seller = product.seller;
  const rawPhone = seller.whatsapp || '';
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
  const instagramHandle = (seller.instagram || '').replace(/^@/, '');

  const defaultWaMessage = `Halo, saya melihat produk ‘${product.title}’ di Nepal Market. Apakah masih tersedia?`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWaMessage)}`;
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div
      id="contact-seller-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="contact-seller-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hubungi Penjual</h3>
            <p className="text-xs text-slate-500 mt-0.5">Penjual: {seller.name}</p>
          </div>
          <button
            id="btn-close-contact-modal"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {seller.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {seller.name}
              </div>
              <div className="text-xs text-slate-500">
                COD di sekitar: {product.location}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Nepal Market memfasilitasi transaksi langsung. Negosiasi harga dan kesepakatan tempat serah terima dilakukan mandiri antara buyer dan seller.
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Opsi WhatsApp */}
            {rawPhone && <a
              id="link-contact-whatsapp"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-xs group min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-5 h-5" />
                <span>Chat via WhatsApp</span>
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
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white rounded-xl font-medium text-sm transition-opacity shadow-xs group min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-5 h-5" />
                  <span>Kirim DM Instagram (@{instagramHandle})</span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            )}

            {/* Salin Nomor HP/WA */}
            {rawPhone && <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 truncate border border-slate-200">
                {rawPhone}
              </div>
              <button
                id="btn-copy-seller-phone"
                type="button"
                onClick={handleCopyPhone}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 min-h-[40px]"
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
            {!rawPhone && !instagramUrl && <p className="text-sm text-slate-600">Penjual belum menambahkan kontak.</p>}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
