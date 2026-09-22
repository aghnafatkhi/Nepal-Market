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
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setErrorMessage(error.message || 'Gagal membuka login Google. Silakan coba lagi.');
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Back button */}
      <div className="max-w-sm w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="max-w-sm w-full mx-auto bg-white rounded-lg border border-slate-200 p-6 sm:p-7">
        {/* Brand Header Minimalis */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            N
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            Nepal<span className="text-blue-600">Market</span>
          </span>
        </div>

        <h1 className="text-lg font-bold text-slate-900 mb-4">
          {mode === 'signin' ? 'Masuk' : 'Daftar Akun'}
        </h1>

        {/* Warning jika env supabase belum ada */}
        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
            Koneksi server akun belum aktif. Silakan jelajahi katalog secara bebas.
          </div>
        )}

        {/* Toggle Mode: Masuk / Daftar */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-md mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessNotice(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
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
            className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Alert Error */}
        {errorMessage && (
          <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alert Success */}
        {successNotice && (
          <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || !isConfigured}
          className="w-full min-h-[40px] py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors flex items-center justify-center mb-4 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="flex items-center gap-2">
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
            <span>{isSubmitting ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            atau email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Form Email & Password */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="input-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="input-name"
                type="text"
                required
                placeholder="Nama lengkap kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              />
            </div>
          )}

          <div>
            <label htmlFor="input-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="input-email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
            />
          </div>

          <div>
            <label htmlFor="input-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <input
              id="input-password"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
            />
          </div>

          <button
            id="btn-submit-auth"
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[42px] py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 mt-3 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Masuk' : 'Daftar'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
