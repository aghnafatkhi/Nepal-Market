import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ isAdmin: false, error: 'Sesi login diperlukan' }, { status: 401 });
    }

    // Jika Supabase belum dikonfigurasi di environment
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json({
        isAdmin: false,
        error: 'Supabase belum terkonfigurasi di server',
      }, { status: 503 });
    }

    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: authError } = await serverSupabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Sesi login tidak valid atau sudah kedaluwarsa' },
        { status: 401 }
      );
    }

    // Jalankan pembacaan dengan JWT pengguna, sehingga RLS tetap berlaku.
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('id, name, username, role')
      .eq('id', userData.user.id)
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
