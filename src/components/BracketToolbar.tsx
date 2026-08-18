import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Grid,
  Eye,
  PlaySquare,
  X,
  Plus,
  Dices,
  MoreVertical,
  Wand2,
  FileDown,
  Layout,
  Save,
  Calendar,
  Network
} from 'lucide-react';
import { BracketLayoutMode } from '../types';

interface BracketToolbarProps {
  bracketSize: number;
  onUpdateBracketSize: (size: number) => void;
  onCreateEmptyBracket: () => void;
  layoutMode: BracketLayoutMode;
  onChangeLayoutMode: (mode: BracketLayoutMode) => void;
  zoomLevel: number;
  onChangeZoom: (delta: number) => void;
  onFitToScreen: () => void;
  onResetZoom: () => void;
  onOpenManualDraw: () => void;
  totalRounds: number;
  activeFilter: string;
  onChangeFilter: (filter: string) => void;
  onRequestResetBracket: () => void;
  isPresentationMode?: boolean;
  onTogglePresentation?: () => void;
  onAutoSizeBracket?: () => void;
  onImportJSON?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV?: () => void;
  onSaveBracket?: () => void;
  activeTab?: string;
  onChangeTab?: (tab: 'bagan' | 'jadwal') => void;
  isAdmin?: boolean;
}

export const BracketToolbar: React.FC<BracketToolbarProps> = ({
  bracketSize,
  onUpdateBracketSize,
  onCreateEmptyBracket,
  layoutMode,
  onChangeLayoutMode,
  zoomLevel,
  onChangeZoom,
  onFitToScreen,
  onResetZoom,
  onOpenManualDraw,
  totalRounds,
  activeFilter,
  onChangeFilter,
  onRequestResetBracket,
  isPresentationMode,
  onTogglePresentation,
  onAutoSizeBracket,
  onImportJSON,
  onExportCSV,
  onSaveBracket,
  activeTab,
  onChangeTab,
  isAdmin,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-20 print:hidden mb-4">
      <div
        className={`bg-slate-800 border border-slate-700/80 rounded-xl p-3 sm:p-4 transition-all duration-300 shadow-xl ${
          isCollapsed ? 'max-h-0 py-0 opacity-0 overflow-hidden border-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
          
          {/* Mobile Always-Visible Row & Desktop Right-Side Group 3 */}
          <div className="flex items-center justify-center gap-2 md:justify-end md:gap-0 w-full md:w-auto md:order-3">
            
            {isPresentationMode && onChangeTab && activeTab && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 mr-2">
                <button
                  type="button"
                  onClick={() => onChangeTab('bagan')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'bagan' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Network size={14} /> Bagan
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTab('jadwal')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'jadwal' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Calendar size={14} /> Jadwal
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {!isPresentationMode && onTogglePresentation && (
                <button
                  type="button"
                  onClick={onTogglePresentation}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center justify-center cursor-pointer"
                  title="Masuk Mode Presentasi"
                >
                  <PlaySquare size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={onFitToScreen}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Sesuai Ukuran Layar"
              >
                <Maximize2 size={13} />
                <span className="hidden sm:inline">Fit</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeZoom(-0.1)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center transition-colors cursor-pointer"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={onResetZoom}
                className="px-1.5 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                title="Reset Zoom Ke 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => onChangeZoom(0.1)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center transition-colors cursor-pointer"
              >
                <ZoomIn size={13} />
              </button>
              {isPresentationMode && onTogglePresentation && (
                <button
                  type="button"
                  onClick={onTogglePresentation}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors flex items-center justify-center cursor-pointer ml-1"
                  title="Keluar Mode Presentasi"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${isMobileMenuOpen ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                title="Tampilkan Pengaturan Lainnya"
              >
                <MoreVertical size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Sembunyikan Pengaturan"
              >
                <ChevronUp size={15} />
              </button>
            </div>
          </div>

          {/* Group 1 & 2 (Hidden on mobile unless opened, visible on desktop) */}
          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center md:items-center gap-3 w-full md:w-auto md:order-1`}>
            
            {/* Group 1: Bracket Size & Creation */}
            {isAdmin && (
            <div className="flex items-center justify-center flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 pl-2.5 pr-1 py-1 rounded-lg border border-slate-700">
                <Grid size={15} className="text-blue-400" />
                <span className="text-slate-300 font-medium">Slot:</span>
                <select
                  value={bracketSize}
                  onChange={(e) => onUpdateBracketSize(parseInt(e.target.value) || 8)}
                  className="w-14 bg-slate-800 text-slate-100 font-bold px-1.5 py-0.5 rounded border border-slate-600 outline-none text-center cursor-pointer"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                  <option value={64}>64</option>
                  <option value={128}>128</option>
                </select>
                {onAutoSizeBracket && (
                  <button
                    type="button"
                    onClick={onAutoSizeBracket}
                    className="p-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 font-bold rounded transition-colors flex items-center cursor-pointer ml-1 border border-indigo-500/30"
                    title="Sesuaikan dengan Jumlah Tim"
                  >
                    <Wand2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCreateEmptyBracket}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors flex items-center cursor-pointer ml-1"
                  title="Buat Bagan Baru"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={onRequestResetBracket}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 rounded-lg transition-colors cursor-pointer"
                title="Reset Seluruh Bagan"
              >
                <RotateCcw size={15} />
              </button>
              
              <div className="hidden md:block w-px h-6 bg-slate-700 mx-1"></div>
              
              <button
                type="button"
                onClick={onOpenManualDraw}
                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                title="Cabut Undian Manual"
              >
                <Dices size={15} />
              </button>
            </div>
            )}

            {/* Tools Menu Desktop */}
            <div className="hidden md:flex items-center justify-center flex-wrap gap-2">
            
              {onSaveBracket && (
                <button
                  type="button"
                  onClick={onSaveBracket}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
                  title="Simpan Bagan ke Database"
                >
                  <Save size={14} />
                  Simpan
                </button>
              )}

              {/* Group 2: Layout & Filters */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => onChangeLayoutMode('two-sided')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    layoutMode === 'two-sided'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ↔️ 2 Arah
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLayoutMode('one-sided')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    layoutMode === 'one-sided'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ➡️ 1 Arah
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                <Eye size={14} className="text-slate-400" />
                <select
                  value={activeFilter}
                  onChange={(e) => onChangeFilter(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs py-0.5 outline-none cursor-pointer"
                >
                  <option value="all">Semua Babak</option>
                  {totalRounds > 0 &&
                    Array.from({ length: totalRounds - 1 }).map((_, i) => {
                      const showRounds = i + 1;
                      let label = `Semi Final & Final`;
                      if (showRounds === 1) label = `Hanya Final`;
                      else if (showRounds === 2) label = `Semi Final & Final`;
                      else label = `Dari Babak ke-${totalRounds - showRounds + 1}`;
                      return (
                        <option key={showRounds} value={showRounds}>
                          {label}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Collapse Button inside menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden flex justify-end w-full order-4 mt-2 pt-2 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => { setIsCollapsed(true); setIsMobileMenuOpen(false); }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs font-semibold w-full justify-center"
              >
                <ChevronUp size={14} /> Sembunyikan Toolbar
              </button>
            </div>
          )}

        </div>
      </div>
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs py-1 text-center rounded-b-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
        >
          <ChevronDown size={14} /> Tampilkan Pengaturan Bagan
        </button>
      )}
    </div>
  );
};
