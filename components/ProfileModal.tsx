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

  // Keyboard Escape listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div 
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="profile-modal-content"
        className="relative w-full max-w-md bg-white rounded-t-xl sm:rounded-lg overflow-hidden border border-slate-200 text-left max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            {viewTab === 'my-listings' ? (
              <button
                type="button"
                onClick={() => setViewTab('profile')}
                className="w-8 h-8 rounded hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Kembali ke profil"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {viewTab === 'my-listings' ? 'Iklan Barang Saya' : 'Profil Pengguna'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {viewTab === 'my-listings' ? `${myProducts.length} barang terdaftar` : 'Akun Nepal Market'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            type="button"
            aria-label="Tutup profil"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {viewTab === 'my-listings' ? (
          /* Sub-view: Iklan Saya */
          <div className="p-4 sm:p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
            {myProducts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Belum Ada Barang yang Dijual</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Punya barang yang masih layak pakai? Pasang iklan sekarang untuk warga sekitar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSellModal();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition-colors inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pasang Iklan</span>
                </button>
              </div>
            ) : (
              myProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-slate-200">
                    <Image 
                      src={prod.imageUrl} 
                      alt={prod.title} 
                      fill 
                      sizes="48px" 
                      className={`object-cover ${prod.isSold ? 'grayscale contrast-75 brightness-95' : ''}`}
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-semibold truncate ${prod.isSold ? 'text-slate-400' : 'text-slate-900'}`}>
                      {prod.title}
                    </h4>
                    <p className={`text-xs mt-0.5 ${prod.isSold ? 'text-slate-400 line-through font-medium' : 'font-bold text-blue-600'}`}>
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
                        className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1 min-h-[36px] cursor-pointer"
                        title="Tandai sudah laku"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Terjual</span>
                      </button>
                    )}
                    {onDeleteProduct && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
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
          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* User Info Card (Logged In vs Guest) */}
            {user ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base uppercase shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.name} 
                        width={44} 
                        height={44} 
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
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-md text-left">
                <h3 className="text-sm font-bold text-blue-950">Belum Login</h3>
                <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
                  Login untuk pasang iklan barang, menyimpan produk favorit, dan menghubungi penjual.
                </p>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="mt-3 w-full min-h-[44px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login atau Daftar</span>
                </Link>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSavedModal();
                }}
                className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
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
                className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                <span className="text-xs text-slate-500 block">Iklan Saya</span>
                <span className="text-xl font-bold text-blue-600 mt-0.5 block">{myListingsCount}</span>
              </button>
            </div>

            {/* Tombol Kelola Iklan Saya jika login */}
            {user && (
              <div className="space-y-2">
                <Link
                  href="/my-products"
                  onClick={onClose}
                  className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-2 border border-blue-200 min-h-[44px]"
                >
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Kelola Produk Saya ({myListingsCount})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setViewTab('my-listings')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
                >
                  <span>Lihat Daftar Ringkas ({myListingsCount})</span>
                </button>
              </div>
            )}

            {/* Tips Transaksi Aman C2C */}
            <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Tips Transaksi COD Aman</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Pilih tempat bertemu yang ramai dan mudah dijangkau.</li>
                <li>Cek kondisi barang secara teliti sebelum membayar.</li>
                <li>Bayar langsung secara tunai atau transfer saat bertemu.</li>
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
                className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Pasang Iklan Barang</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] py-2 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
