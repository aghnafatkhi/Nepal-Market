import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    // Jika Supabase belum dikonfigurasi di environment
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
      // Demo preview mode: Izinkan admin jika role disetel di state client atau email tertentu
      return NextResponse.json({
        isConfigured: false,
        isAdmin: true,
        message: 'Mode preview aktif: Supabase belum terkonfigurasi di server',
      });
    }

    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let verifiedUserId = userId;

    // Jika ada token Bearer, verifikasi langsung secara kriptografis dengan Supabase Auth di server
    if (token) {
      const { data: userData, error: authError } = await serverSupabase.auth.getUser(token);
      if (authError || !userData?.user) {
        return NextResponse.json(
          { isAdmin: false, error: 'Sesi login tidak valid atau sudah kedaluwarsa' },
          { status: 401 }
        );
      }
      verifiedUserId = userData.user.id;
    }

    if (!verifiedUserId) {
      return NextResponse.json(
        { isAdmin: false, error: 'User ID tidak ditemukan' },
        { status: 400 }
      );
    }

    // Periksa tabel profiles di database untuk memastikan role adalah 'admin'
    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('id, name, username, role, email, is_suspended')
      .eq('id', verifiedUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { isAdmin: false, error: 'Profil pengguna tidak ditemukan di sistem' },
        { status: 404 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        {
          isAdmin: false,
          error: 'Akses ditolak: Akun ini tidak memiliki hak akses administrator',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      profile,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Terjadi kesalahan pada verifikasi server' },
      { status: 500 }
    );
  }
}
