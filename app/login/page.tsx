'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Jika sudah login, redirect langsung
  React.useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleGoogleSignIn = async () => {
    setSuccessNotice(null);
    setErrorMessage('Login dengan Google saat ini belum dikonfigurasi. Silakan masuk atau daftar menggunakan email dan kata sandi di bawah.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email atau kata sandi salah. Silakan periksa kembali.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Email belum dikonfirmasi. Silakan periksa kotak masuk atau folder spam kamu.');
        } else {
          setErrorMessage(error.message || 'Gagal masuk akun. Silakan coba lagi.');
        }
        setIsSubmitting(false);
      } else {
        // Berhasil login
        router.push(redirectTo);
      }
    } else {
      // Sign Up
      if (!name.trim()) {
        setErrorMessage('Silakan masukkan nama lengkap kamu.');
        setIsSubmitting(false);
        return;
      }

      const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, name);
      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMessage('Email ini sudah terdaftar. Silakan pilih tab "Masuk".');
        } else {
          setErrorMessage(error.message || 'Gagal membuat akun. Silakan periksa data kamu.');
        }
        setIsSubmitting(false);
      } else {
        if (needsEmailConfirmation) {
          setSuccessNotice(`Tautan konfirmasi telah dikirim ke ${email}. Silakan buka email kamu untuk verifikasi.`);
          setIsSubmitting(false);
        } else {
          // Terverifikasi langsung
          router.push(redirectTo);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="max-w-md w-full mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-3">
            N
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {mode === 'signin' ? 'Masuk ke Nepal Market' : 'Buat Akun Nepal Market'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {mode === 'signin' 
              ? 'Masuk untuk memasang iklan dan mengelola barang favorit'
              : 'Daftar untuk mulai jual dan beli barang di lingkungan Nepal'
            }
          </p>
        </div>

        {/* Warning jika env supabase belum ada */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold mb-1">Fitur Akun Belum Siap</p>
            <p className="text-amber-800 leading-relaxed">
              Konfigurasi server akun belum terpasang. Kamu tetap dapat menjelajahi barang secara bebas.
            </p>
          </div>
        )}

        {/* Toggle Mode: Masuk / Daftar */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessNotice(null);
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessNotice(null);
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Alert Error */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alert Success */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full min-h-[44px] py-2.5 px-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs mb-5"
          title="Login dengan Google saat ini belum dikonfigurasi"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Google</span>
          <span className="text-[11px] font-normal text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
            Belum Tersedia
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            atau gunakan email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="input-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-name"
                  type="text"
                  required
                  placeholder="Nama lengkap kamu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="input-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="input-email"
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-password"
                type="password"
                required
                minLength={6}
                placeholder="Masukkan minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
              />
            </div>
          </div>

          <button
            id="btn-submit-auth"
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Masuk' : 'Daftar Akun'}</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-400 mt-6 leading-relaxed">
          Dengan melanjutkan, kamu menyetujui panduan transaksi aman dan aturan komunitas Nepal Market.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
