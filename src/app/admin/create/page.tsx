import React from 'react';
import { TournamentWizard } from '@/components/tournament/TournamentWizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateTournamentPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
        </Link>
      </div>

      <TournamentWizard />
    </div>
  );
}

