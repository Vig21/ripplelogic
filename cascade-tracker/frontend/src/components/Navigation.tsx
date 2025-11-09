'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCascadeStore } from '@/store/cascadeStore';
import { Space_Grotesk } from 'next/font/google';

const brandFont = Space_Grotesk({ subsets: ['latin'], weight: ['600','700'], display: 'swap' });

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useCascadeStore();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/75 backdrop-blur-md border-b border-white/10">
      <div className="page-container px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="Ripple Logic home" className="flex items-center gap-3 group interactive hover:scale-[1.02]">
            {/* Brand Icon: Ripple rings with gradient stroke */}
            <span aria-hidden="true" className="inline-flex items-center justify-center">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="rippleGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2FE3FF" />
                    <stop offset="100%" stopColor="#00FFC2" />
                  </linearGradient>
                </defs>
                {/* Concentric ripples */}
                <circle cx="12" cy="12" r="7.5" stroke="url(#rippleGradient)" strokeWidth="1.5" opacity="0.45" />
                <circle cx="12" cy="12" r="5" stroke="url(#rippleGradient)" strokeWidth="1.5" opacity="0.7" />
                <circle cx="12" cy="12" r="2.5" stroke="url(#rippleGradient)" strokeWidth="1.5" />
                {/* Center pulse */}
                <circle cx="12" cy="12" r="1.4" fill="#2FE3FF" />
              </svg>
            </span>
            <span className={`${brandFont.className} text-2xl sm:text-3xl tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-pm-blue to-pm-teal drop-shadow-[0_0_12px_rgba(47,227,255,0.45)] group-hover:drop-shadow-[0_0_20px_rgba(47,227,255,0.55)] transition`}>
              <span className="font-extrabold">Ripple</span>
              <span className="font-semibold ml-1">Logic</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="relative">
            <div className="glass-card gradient-border shadow-glow px-3 py-1.5 rounded-full">
              <div className="relative flex items-center gap-6">
                <NavLink href="/" active={isActive('/')} label="Home" />
                <NavLink
                  href="/cascades"
                  active={pathname === '/cascades' || pathname?.startsWith('/cascade/') || false}
                  label="Cascades"
                />
                <NavLink href="/learn" active={pathname?.startsWith('/learn') || false} label="Learn" />
                <NavLink href="/leaderboard" active={isActive('/leaderboard')} label="Leaderboard" />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15 shadow-inner-glow">
                <span className="text-xs text-pm-blue font-semibold">
                  {user.username}
                </span>
                <span className="text-xs text-cyan-300 font-bold">
                  {user.score}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium transition interactive hover:scale-[1.02] ${
        active ? 'text-pm-blue' : 'text-gray-300 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
