import Link from 'next/link';

interface FooterProps {
  className?: string;
}

const links = [
  { href: '/', label: 'Beranda' },
  { href: '/sell', label: 'Jual barang' },
  { href: '/saved', label: 'Tersimpan' },
  { href: '/profile', label: 'Profil' },
];

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer
      className={`mt-auto border-t border-slate-200 bg-white pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] pt-7 sm:pb-7 ${className}`}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Link href="/" className="text-sm font-bold tracking-tight text-slate-950">
              Nepal <span className="text-blue-600">Market</span>
            </Link>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Tempat jual beli barang di sekitar Nepal.
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-blue-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="border-t border-slate-100 pt-4 text-[11px] text-slate-400">
          © {new Date().getFullYear()} Nepal Market
        </p>
      </div>
    </footer>
  );
}
