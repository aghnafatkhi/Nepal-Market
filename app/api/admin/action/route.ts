import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Optional server-only service role key if configured in server environment
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface AdminActionPayload {
  action: 'hide_product' | 'restore_product' | 'remove_product' | 'suspend_user' | 'unsuspend_user' | 'resolve_report' | 'review_report';
  targetId: string;
  targetTitle?: string;
  reason: string;
  reportId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Sesi login tidak ditemukan. Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json(
        { success: false, error: 'Koneksi Supabase belum terkonfigurasi di server.' },
        { status: 503 }
      );
    }

    // 1. Verifikasi token pengguna via Supabase Auth
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Sesi login tidak sah atau telah kedaluwarsa.' },
        { status: 401 }
      );
    }

    const callerId = authData.user.id;

    // 2. Verifikasi status admin di tabel profiles (BUKAN user_metadata)
    // Gunakan client dengan JWT pengguna agar tetap mematuhi RLS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerProfile, error: profileError } = await userClient
      .from('profiles')
      .select('id, name, username, role, is_suspended')
      .eq('id', callerId)
      .single();

    if (profileError || !callerProfile) {
      return NextResponse.json(
        { success: false, error: 'Profil administrator tidak ditemukan di sistem.' },
        { status: 404 }
      );
    }

    // Pastikan otorisasi benar-benar 'admin' dari basis data profiles
    if (callerProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang administrator.' },
        { status: 403 }
      );
    }

    if (callerProfile.is_suspended) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Akun administrator ini sedang dinonaktifkan.' },
        { status: 403 }
      );
    }

    // 3. Parse dan validasi body permintaan
    const body: AdminActionPayload = await req.json();
    const { action, targetId, targetTitle = '', reason = '', reportId } = body;

    if (!action || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Parameter tindakan atau target ID tidak lengkap.' },
        { status: 400 }
      );
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason && action !== 'resolve_report') {
      return NextResponse.json(
        { success: false, error: 'Alasan tindakan wajib diisi untuk catatan riwayat audit moderasi.' },
        { status: 400 }
      );
    }

    // 4. Aturan Keamanan Khusus:
    // a. Admin tidak boleh menangguhkan dirinya sendiri
    if (action === 'suspend_user' && targetId === callerId) {
      return NextResponse.json(
        { success: false, error: 'Tindakan ditolak: Administrator tidak diperbolehkan menangguhkan akun sendiri.' },
        { status: 400 }
      );
    }

    // Client eksekusi: gunakan userClient (dengan JWT admin yang memiliki hak RLS)
    // atau service role client jika dikonfigurasi di backend
    const execClient = supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : userClient;

    let targetType: 'product' | 'profile' | 'report' = 'product';
    let actionLogType = action;

    // 5. Eksekusi tindakan sesuai tipe
    switch (action) {
      case 'hide_product': {
        targetType = 'product';
        const { error: hideErr } = await execClient
          .from('products')
          .update({ status: 'hidden', updated_at: new Date().toISOString() })
          .eq('id', targetId);

        if (hideErr) {
          return NextResponse.json(
            { success: false, error: `Gagal menyembunyikan produk: ${hideErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'restore_product': {
        targetType = 'product';
        const { error: restoreErr } = await execClient
          .from('products')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', targetId);

        if (restoreErr) {
          return NextResponse.json(
            { success: false, error: `Gagal mengaktifkan produk: ${restoreErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'remove_product': {
        targetType = 'product';
        const { error: removeErr } = await execClient
          .from('products')
          .update({ status: 'removed', updated_at: new Date().toISOString() })
          .eq('id', targetId);

        if (removeErr) {
          return NextResponse.json(
            { success: false, error: `Gagal menghapus produk: ${removeErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'suspend_user': {
        targetType = 'profile';
        // Pastikan target bukan akun admin yang sama
        if (targetId === callerId) {
          return NextResponse.json(
            { success: false, error: 'Tidak dapat menangguhkan akun sendiri.' },
            { status: 400 }
          );
        }

        const { error: suspendErr } = await execClient
          .from('profiles')
          .update({
            is_suspended: true,
            suspension_reason: trimmedReason,
          })
          .eq('id', targetId);

        if (suspendErr) {
          return NextResponse.json(
            { success: false, error: `Gagal menangguhkan pengguna: ${suspendErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'unsuspend_user': {
        targetType = 'profile';
        const { error: unsuspendErr } = await execClient
          .from('profiles')
          .update({
            is_suspended: false,
            suspension_reason: null,
          })
          .eq('id', targetId);

        if (unsuspendErr) {
          return NextResponse.json(
            { success: false, error: `Gagal memulihkan pengguna: ${unsuspendErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'resolve_report': {
        targetType = 'report';
        const { error: reportErr } = await execClient
          .from('reports')
          .update({ status: 'resolved' })
          .eq('id', targetId);

        if (reportErr) {
          return NextResponse.json(
            { success: false, error: `Gagal memperbarui status laporan: ${reportErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      case 'review_report': {
        targetType = 'report';
        const { error: reportErr } = await execClient
          .from('reports')
          .update({ status: 'reviewed' })
          .eq('id', targetId);

        if (reportErr) {
          return NextResponse.json(
            { success: false, error: `Gagal memperbarui status laporan: ${reportErr.message}` },
            { status: 500 }
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Jenis tindakan tidak dikenali oleh sistem.' },
          { status: 400 }
        );
    }

    // Jika ada laporan yang terkait dan diselesaikan bersamaan dengan tindakan produk
    if (reportId && (action === 'hide_product' || action === 'remove_product')) {
      await execClient
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);
    }

    // 6. Catat riwayat audit moderasi ke tabel moderation_logs
    try {
      await execClient.from('moderation_logs').insert({
        admin_id: callerId,
        action: actionLogType,
        target_type: targetType,
        target_id: targetId,
        target_title: targetTitle || null,
        reason: trimmedReason || 'Tindakan moderasi administratif',
      });
    } catch (logErr) {
      console.warn('Peringatan: Gagal mencatat log moderasi server:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `Tindakan ${action} pada target "${targetTitle || targetId}" berhasil diproses dan dicatat.`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal pada server moderasi.' },
      { status: 500 }
    );
  }
}
