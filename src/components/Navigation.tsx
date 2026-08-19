import React, { useState, useRef, useEffect } from 'react';
import { Users, Trophy, Calendar, MoreVertical, PlaySquare, Shuffle, Dices, Printer, Download, Upload, Trash2, Sparkles, Lock, Unlock } from 'lucide-react';

export type TabType = 'peserta' | 'bagan' | 'jadwal';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  teamCount: number;
  onPrint?: () => void;
  onOpenLiveDraw?: () => void;
  
  onAutoDistributeByes?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV?: () => void;
  onResetAllData?: () => void;
  isAdmin?: boolean;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  isDrawLocked?: boolean;
  isAdminLockEnabled?: boolean;
  onToggleAdminLock?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  teamCount,
  onTogglePresentation,
  onPrint,
  onOpenLiveDraw,
  onAutoDistributeByes,
  onExportJSON,
  onImportJSON,
  onExportCSV,
  onResetAllData,
  isAdmin,
  onOpenLogin,
  onLogout,
  isDrawLocked = false,
  isAdminLockEnabled = false,
  onToggleAdminLock,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-slate-800 border-b border-slate-700/80 px-4 sm:px-8 flex justify-between overflow-visible print:hidden">
      <div className="flex gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelectTab('peserta')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'peserta'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          <Users size={18} />
          <span>TIM</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('bagan')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'bagan'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          <Trophy size={18} />
          <span>Skema</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('jadwal')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'jadwal'
              ? 'border-amber-500 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
          }`}
        >
          <Calendar size={18} />
          <span>JADWAL</span>
        </button>
      </div>

      <div className="flex items-center ml-4 relative" ref={menuRef}>
        {isAdmin && onToggleAdminLock && (
          <button
            type="button"
            onClick={onToggleAdminLock}
            className={`p-2 rounded-lg transition-colors cursor-pointer mr-1 ${
              isAdminLockEnabled 
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
            title={isAdminLockEnabled ? 'Buka Kunci Skema' : 'Kunci Skema'}
          >
            {isAdminLockEnabled ? <Lock size={20} /> : <Unlock size={20} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          title="Menu Aksi"
        >
          <MoreVertical size={20} />
        </button>
        
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1">
            {onOpenLiveDraw && (
              <button
                onClick={() => {
                  if (isDrawLocked) return;
                  onOpenLiveDraw();
                  setIsMenuOpen(false);
                }}
                disabled={isDrawLocked}
                className={`px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-2 transition-colors ${
                  isDrawLocked
                    ? 'text-slate-500 cursor-not-allowed bg-slate-800'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-amber-400 cursor-pointer'
                }`}
              >
                <Shuffle size={16} /> Live Draw Bagan
              </button>
            )}
            
            {onAutoDistributeByes && (
              <button
                onClick={() => { onAutoDistributeByes(); setIsMenuOpen(false); }}
                className="px-4 py-2.5 text-left text-sm font-semibold text-slate-300 hover:bg-slate-700/50 hover:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles size={16} /> Sebar BYE Otomatis
              </button>
            )}
            {onPrint && (
              <button
                onClick={() => { onPrint(); setIsMenuOpen(false); }}
                className="px-4 py-2.5 text-left text-sm font-semibold text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer size={16} /> Cetak & Simpan PDF
              </button>
            )}

            {isAdmin && (
              <>
                <div className="h-px bg-slate-700/80 my-2 mx-2"></div>
                {onOpenLiveDraw && (
                  <button
                    onClick={() => {
                      if (isDrawLocked) return;
                      onOpenLiveDraw();
                      setIsMenuOpen(false);
                    }}
                    disabled={isDrawLocked}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 font-semibold group transition-colors ${
                      isDrawLocked
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-400 cursor-pointer'
                    }`}
                  >
                    <Dices size={16} className={isDrawLocked ? "text-slate-600" : "text-emerald-500 group-hover:scale-110 transition-transform"} />
                    Live Draw <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${isDrawLocked ? 'bg-slate-700 text-slate-500' : 'bg-emerald-500/20 text-emerald-400'}`}>Pro</span>
                  </button>
                )}
                {onAutoDistributeByes && (
                  <button
                    onClick={() => {
                      onAutoDistributeByes();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Shuffle size={16} className="text-slate-400" />
                    Sebar BYE Otomatis
                  </button>
                )}
                
                <div className="h-px bg-slate-700/80 my-2 mx-2"></div>
                
                {onExportJSON && (
                  <button
                    onClick={() => {
                      onExportJSON();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Download size={16} className="text-slate-400" />
                    Export Data (JSON)
                  </button>
                )}
                {onImportJSON && (
                  <label className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3 cursor-pointer">
                    <Upload size={16} className="text-slate-400" />
                    Import Data (JSON)
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        onImportJSON(e);
                        setIsMenuOpen(false);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                {onExportCSV && (
                  <button
                    onClick={() => {
                      onExportCSV();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Download size={16} className="text-slate-400" />
                    Export CSV
                  </button>
                )}

                <div className="h-px bg-slate-700/80 my-2 mx-2"></div>

                {onResetAllData && (
                  <button
                    onClick={() => {
                      onResetAllData();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Trash2 size={16} className="text-rose-500" />
                    Hapus Semua Data
                  </button>
                )}
                
                <div className="h-px bg-slate-700/80 my-2 mx-2"></div>
              </>
            )}
            
            {isAdmin ? (
              <button
                onClick={() => {
                  if (onLogout) onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 transition-colors flex items-center gap-3 cursor-pointer"
              >
                Logout Admin
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 transition-colors flex items-center gap-3 cursor-pointer"
              >
                Login Admin 🔒
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
