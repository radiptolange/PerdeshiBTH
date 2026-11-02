import React from 'react';
import Link from 'next/link';
import { Trophy, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#070A10] border-t border-white/10 py-10 mt-20 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="font-bold text-white font-mono tracking-wider">
              BTH ESPORTS • RISE AND SHINE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link href="/tournaments" className="hover:text-white transition">
              Tournaments
            </Link>
            <Link href="/clans" className="hover:text-white transition">
              Clans
            </Link>
            <Link href="/admin" className="hover:text-white transition">
              Admin Portal
            </Link>
            <a
              href="https://facebook.com/bthesports"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition"
            >
              Community Discord
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 BTH Gaming Esports Nepal. All tournament engine rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for Competitive Gaming in South Asia (`Asia/Kathmandu`).
          </p>
        </div>
      </div>
    </footer>
  );
}

