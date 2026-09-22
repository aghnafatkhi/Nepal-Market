import React from 'react';

export type StatusType = 
  | 'active' 
  | 'hidden' 
  | 'removed' 
  | 'pending' 
  | 'reviewed' 
  | 'resolved' 
  | 'dismissed' 
  | 'suspended' 
  | 'user_active' 
  | 'admin_role' 
  | 'user_role'
  | 'sponsor_active'
  | 'sponsor_inactive'
  | 'draft'
  | 'live'
  | 'scheduled'
  | 'ended';

interface AdminStatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  let text = label || status;
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'active':
    case 'sponsor_active':
      text = label || 'Aktif';
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'hidden':
      text = label || 'Tersembunyi';
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'removed':
      text = label || 'Dihapus';
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'pending':
      text = label || 'Menunggu Tindakan';
      style = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      break;
    case 'reviewed':
      text = label || 'Ditinjau';
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'resolved':
      text = label || 'Selesai';
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'dismissed':
      text = label || 'Ditolak';
      style = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'suspended':
      text = label || 'Dinonaktifkan';
      style = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      break;
    case 'user_active':
      text = label || 'Aktif';
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'admin_role':
      text = label || 'Admin';
      style = 'bg-slate-900 text-rose-300 border-slate-700';
      break;
    case 'user_role':
      text = label || 'Anggota';
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'sponsor_inactive':
      text = label || 'Nonaktif';
      style = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'draft':
      text = label || 'Draft';
      style = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'live':
      text = label || 'Sedang Tayang';
      style = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'scheduled':
      text = label || 'Terjadwal';
      style = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'ended':
      text = label || 'Berakhir';
      style = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'hide_product':
      text = label || 'Sembunyikan Produk';
      style = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
      break;
    case 'remove_product':
      text = label || 'Hapus Produk';
      style = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
      break;
    case 'restore_product':
      text = label || 'Pulihkan Produk';
      style = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
      break;
    case 'suspend_user':
      text = label || 'Tangguhkan Pengguna';
      style = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
      break;
    case 'unsuspend_user':
      text = label || 'Pulihkan Pengguna';
      style = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
      break;
    case 'resolve_report':
      text = label || 'Selesaikan Laporan';
      style = 'bg-teal-50 text-teal-800 border-teal-300 font-medium';
      break;
    case 'review_report':
      text = label || 'Tinjau Laporan';
      style = 'bg-sky-50 text-sky-800 border-sky-300 font-medium';
      break;
    case 'dismiss_report':
      text = label || 'Tolak Laporan';
      style = 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
      break;
    case 'create_sponsor':
      text = label || 'Tambah Sponsor';
      style = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-medium';
      break;
    case 'update_sponsor':
      text = label || 'Edit Sponsor';
      style = 'bg-blue-50 text-blue-800 border-blue-300 font-medium';
      break;
    case 'delete_sponsor':
      text = label || 'Hapus Sponsor';
      style = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
      break;
    default:
      text = label || status;
      style = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style} ${className}`}
    >
      {text}
    </span>
  );
};
