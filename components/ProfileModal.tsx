'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, User, ShieldCheck, PlusCircle, LogIn, LogOut, Package, CheckCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCount: number;
  myListingsCount: number;
  myProducts?: Product[];
  onOpenSellModal: () => void;
  onOpenSavedModal: () => void;
  onMarkProductSold?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  savedCount,
  myListingsCount,
  myProducts = [],
  onOpenSellModal,
  onOpenSavedModal,
  onMarkProductSold,
  onDeleteProduct,
}) => {
  const { user, profile, signOut } = useAuth();
  const [viewTab, setViewTab] = useState<'profile' | 'my-listings'>('profile');

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div 
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="profile-modal-content"
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {viewTab === 'my-listings' ? (
              <button
                type="button"
                onClick={() => setViewTab('profile')}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
                title="Kembali ke profil"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {viewTab === 'my-listings' ? 'Iklan Barang Saya' : 'Profil Pengguna'}
              </h2>
              <p className="text-xs text-slate-500">
                {viewTab === 'my-listings' ? `${myProducts.length} barang terdaftar` : 'Warga Nepal Market'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            type="button"
            aria-label="Tutup profil"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {viewTab === 'my-listings' ? (
          /* Sub-view: Iklan Saya */
          <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
            {myProducts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Belum ada barang yang kamu jual</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Punya barang tak terpakai di kos atau kamar? Pasang iklan sekarang dan temukan pembeli terdekat.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSellModal();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pasang Iklan Sekarang</span>
                </button>
              </div>
            ) : (
              myProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                    <Image 
                      src={prod.imageUrl} 
                      alt={prod.title} 
                      fill 
                      sizes="48px" 
                      className="object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {prod.title}
                    </h4>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">
                      {formatRupiah(prod.price)}
                    </p>
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded mt-1 ${
                      prod.isSold 
                        ? 'bg-slate-200 text-slate-600' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {prod.isSold ? 'Sudah Terjual' : 'Aktif Dijual'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!prod.isSold && onMarkProductSold && (
                      <button
                        type="button"
                        onClick={() => onMarkProductSold(prod.id)}
                        className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                        title="Tandai sudah laku"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Laku</span>
                      </button>
                    )}
                    {onDeleteProduct && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus iklan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Main Profile View */
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* User Info Card (Logged In vs Guest) */}
            {user ? (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base uppercase shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.name} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (profile?.name || user.email || 'U').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {profile?.name || user.email?.split('@')[0]}
                      </h3>
                      {profile?.role === 'admin' ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                          Admin
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded">
                          Warga
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      @{profile?.username || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Guest Card */
              <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl text-left">
                <h3 className="text-sm font-bold text-blue-950">Belum Masuk Akun</h3>
                <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
                  Masuk untuk pasang iklan barang, simpan favorit, dan hubungi penjual secara langsung.
                </p>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="mt-3 w-full min-h-[40px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk atau Daftar Akun</span>
                </Link>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSavedModal();
                }}
                className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors"
              >
                <span className="text-xs text-slate-500 block">Barang Disimpan</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{savedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setViewTab('my-listings');
                  } else {
                    onClose();
                  }
                }}
                className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors"
              >
                <span className="text-xs text-slate-500 block">Iklan Kamu</span>
                <span className="text-xl font-bold text-blue-600 mt-0.5 block">{myListingsCount}</span>
              </button>
            </div>

            {/* Tombol Kelola Iklan Saya jika login */}
            {user && (
              <button
                type="button"
                onClick={() => setViewTab('my-listings')}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4 text-slate-600" />
                <span>Kelola Iklan Saya ({myListingsCount})</span>
              </button>
            )}

            {/* Tips Transaksi Aman C2C */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pedoman Transaksi Komunitas</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Pilih titik serah terima (COD) di area ramai atau umum.</li>
                <li>Periksa kondisi fisik barang secara menyeluruh sebelum membayar.</li>
                <li>Selesaikan pembayaran langsung secara tunai atau QRIS saat serah terima.</li>
              </ul>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSellModal();
                }}
                className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Pasang Iklan Barang Baru</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[40px] py-2 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
