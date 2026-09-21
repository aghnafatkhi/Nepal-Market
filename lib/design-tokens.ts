/**
 * Nepal Market - Design System Tokens & Utility Classes
 * 
 * Prinsip:
 * 1. Marketplace komunitas yang sederhana, padat, dan praktis
 * 2. Mobile-first dengan touch-target minimal 44x44px
 * 3. Maksimal 2-3 tingkat border radius (container: rounded-lg 8px, control: rounded-md 6px, avatar: rounded-full)
 * 4. Tanpa glassmorphism, tanpa gradien gelap SaaS, minim shadow (utamakan border tipis)
 * 5. Biru Nepal Market (blue-600) hanya untuk aksi utama, link aktif, dan penanda penting
 */

export const tokens = {
  // Border Radius hierarchy
  radius: {
    container: 'rounded-lg', // 8px untuk kartu, banner, modal, panel
    control: 'rounded-md',   // 6px untuk tombol, input, dropdown, chip
    full: 'rounded-full',    // untuk avatar dan status indicator bulat
  },

  // Color semantics
  colors: {
    primary: {
      default: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
      text: 'text-blue-600 hover:text-blue-700',
      border: 'border-blue-600',
      subtle: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    surface: {
      page: 'bg-[#F8FAFC]',
      card: 'bg-white',
      subtle: 'bg-slate-50',
      border: 'border-slate-200',
      borderStrong: 'border-slate-300',
    },
    text: {
      main: 'text-slate-900',
      body: 'text-slate-700',
      muted: 'text-slate-500',
      subtle: 'text-slate-400',
    },
    danger: {
      default: 'bg-rose-600 hover:bg-rose-700 text-white',
      subtle: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    },
    whatsapp: {
      default: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
    },
  },

  // Typography scale
  typography: {
    h1: 'text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight',
    h2: 'text-base sm:text-lg font-bold text-slate-900 leading-snug',
    h3: 'text-sm sm:text-base font-semibold text-slate-900 leading-snug',
    body: 'text-sm text-slate-700 leading-normal',
    caption: 'text-xs text-slate-500 leading-normal',
    price: 'text-base sm:text-lg font-bold text-slate-900 tracking-tight',
  },
} as const;

// Reusable standard CSS class combinations
export const buttonStyles = {
  base: 'inline-flex items-center justify-center font-medium transition-colors select-none rounded-md min-h-[44px] text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  variants: {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-transparent shadow-2xs',
    secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs',
    outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-200',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-transparent',
    text: 'bg-transparent hover:text-blue-700 text-blue-600 p-0 min-h-0 h-auto font-medium',
    destructive: 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200',
    destructiveSolid: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-transparent',
    whatsapp: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-transparent shadow-2xs',
  },
  sizes: {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-5 py-2.5 text-base min-h-[48px]',
    icon: 'w-11 h-11 p-0 flex items-center justify-center',
    iconSm: 'w-9 h-9 p-0 flex items-center justify-center',
  },
};

export const inputStyles = {
  base: 'w-full px-3 py-2 bg-white text-sm text-slate-900 rounded-md border border-slate-300 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 min-h-[44px] transition-colors',
  error: 'border-rose-400 focus:border-rose-600 focus:ring-rose-600',
};

export const cardStyles = {
  base: 'bg-white border border-slate-200 rounded-lg overflow-hidden',
  interactive: 'bg-white border border-slate-200 hover:border-slate-300 transition-colors rounded-lg overflow-hidden',
};
