import React, { useState } from 'react';
import {
  Trophy,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700/80 px-4 sm:px-6 py-3 flex-wrap items-center justify-between gap-4 z-20 shadow-md print:hidden flex">
      {/* App Branding & Editable Title */}
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
          <Trophy size={22} />
        </div>
        <div className="flex-1">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                autoFocus
                className="bg-slate-900 border border-emerald-500 text-slate-100 font-bold text-lg px-2 py-0.5 rounded outline-none w-full"
              />
            </form>
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2 cursor-pointer hover:text-emerald-400 transition-colors group"
              title="Klik untuk ubah judul turnamen"
            >
              <span>{title}</span>
              <span className="text-emerald-400 text-sm font-semibold opacity-80 group-hover:opacity-100">
                - Papan Skema
              </span>
            </h1>
          )}
          <p className="text-xs text-slate-400">
            Sistem Live Draw & Bagan Dinamis Turnamen
          </p>
        </div>
      </div>
    </header>
  );
};
