import React, { useState } from 'react';
import { Trophy, Check, X, Calendar, MapPin, Hash } from 'lucide-react';
import { Match, Team } from '../types';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}-${month}-${year}`; 
};

const FormattedDateInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void; 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type={isFocused ? "date" : "text"}
      value={isFocused ? (value || '') : (value ? formatDate(value) : '')}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tanggal"
      className="bg-transparent text-slate-300 outline-none w-full text-[11px] [color-scheme:dark] hover:text-white transition-colors cursor-pointer"
    />
  );
};

interface MatchCardProps {
  match: Match;
  rIdx: number;
  mIdx: number;
  isFirstRound: boolean;
  isFinal: boolean;
  teams: Team[];
  slotNumber1?: number;
  slotNumber2?: number;
  onSelectTeamSlot?: (
    rIdx: number,
    mIdx: number,
    teamProp: 't1' | 't2',
    teamId: string
  ) => void;
  onSelectWinner?: (rIdx: number, mIdx: number, teamProp: 't1' | 't2') => void;
  onRequestUndoWinner?: (
    rIdx: number,
    mIdx: number,
    teamProp: 't1' | 't2'
  ) => void;
  onUpdateSchedule?: (
    rIdx: number,
    mIdx: number,
    field: 'date' | 'court' | 'matchNum',
    val: string
  ) => void;
  onUpdateScore?: (
    rIdx: number,
    mIdx: number,
    score1: string,
    score2: string
  ) => void;
  courtsList?: string[];
  usedTeamIds?: Set<string>;
  highlightedTeamId?: string | null;
  isAdmin?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  rIdx,
  mIdx,
  isFirstRound,
  isFinal,
  teams,
  slotNumber1,
  slotNumber2,
  onSelectTeamSlot,
  onSelectWinner,
  onRequestUndoWinner,
  onUpdateSchedule,
  courtsList = ['Lap 1', 'Lap 2'],
  usedTeamIds = new Set<string>(),
  highlightedTeamId,
  isAdmin,
}) => {
  const renderSlot = (teamProp: 't1' | 't2', slotNum?: number) => {
    let team = match[teamProp];
    if (team && team.id !== 'BYE') {
      const updated = teams.find((t) => t.id === team!.id);
      if (updated) team = updated;
    }

    const isWinner =
      match.winner && team && match.winner.id === team.id;
    const isBye = team && team.id === 'BYE';
    const isLoser = match.winner && !isWinner && !isBye && team;
    const opponent = teamProp === 't1' ? match.t2 : match.t1;
    const isFacingBye = isFirstRound && opponent?.id === 'BYE' && !isBye && team;
    const isHighlighted = highlightedTeamId !== undefined && highlightedTeamId !== null && team?.id === highlightedTeamId;

    return (
      <div
        className={`px-3 py-3 items-center justify-between border-b border-slate-700/40 last:border-b-0 text-xs min-h-[46px] transition-all duration-300 relative overflow-hidden ${
          isBye ? 'hidden group-hover:flex bg-slate-900/40' : 'flex'
        } ${
          isHighlighted
            ? 'highlighted-slot bg-blue-900/40 text-blue-100 font-bold'
            : isWinner
            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-900/40 text-emerald-300 font-bold'
            : isBye
            ? 'text-slate-500/60 italic'
            : isLoser
            ? 'opacity-40 grayscale hover:opacity-70 text-slate-300'
            : isFacingBye
            ? 'bg-indigo-900/20 ring-1 ring-inset ring-indigo-500/50 text-indigo-200 rounded-sm m-0.5'
            : 'hover:bg-slate-800/60 text-slate-200'
        }`}
      >
        {isHighlighted && (
          <>
            <div className="absolute inset-0 bg-blue-400/30 animate-pulse pointer-events-none z-0" />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(96,165,250,0.6)] border-y border-r border-blue-400/50 pointer-events-none z-0" />
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] z-0" />
          </>
        )}
        {isWinner && <div className="absolute inset-0 bg-emerald-400/10 animate-pulse pointer-events-none" />}
        {isWinner && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
        {team && !isWinner && !isLoser && !isBye && !isHighlighted && (
           <div className={`absolute left-0 top-0 bottom-0 w-1 ${
             team.category === 'Seeded A' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 
             team.category === 'Seeded B' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 
             'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
           }`} />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2 relative z-10">
          {slotNum !== undefined && (
            <span className="w-5 h-5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-inner">
              {slotNum}
            </span>
          )}

          {isFirstRound ? (
            <select
              value={isBye ? 'BYE' : team ? team.id : ''}
              disabled={!isAdmin || !onSelectTeamSlot}
              onChange={(e) =>
                onSelectTeamSlot?.(rIdx, mIdx, teamProp, e.target.value)
              }
              className={`w-full rounded px-2 py-1 text-xs outline-none transition-colors border ${
                isBye 
                  ? 'bg-rose-950/30 text-rose-400 border-rose-800/50 focus:border-rose-500' 
                  : isFacingBye
                  ? 'bg-indigo-950/40 text-indigo-200 border-indigo-500/60 focus:border-indigo-400 focus:bg-indigo-900/60'
                  : 'bg-slate-900/80 text-slate-200 border-slate-700/60 focus:border-blue-500 focus:bg-slate-900'
              } disabled:cursor-not-allowed`}
            >
              <option value="" className="text-slate-200 bg-slate-900">-- Pilih Tim --</option>
              <option value="BYE" className="text-rose-400 bg-slate-900 font-bold">[ KOSONG / BYE ]</option>
              {teams
                  .filter(t => !usedTeamIds?.has(t.id) || (team && t.id === team.id))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                <option key={t.id} value={t.id} className="text-slate-200 bg-slate-900">
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <div className={`truncate font-medium ${isBye ? 'text-rose-400 font-bold' : 'text-slate-100'}`} title={team ? team.name : '---'}>
              {team ? (
                <span className="flex items-center gap-1.5">
                  {isBye ? '[ KOSONG / BYE ]' : team.name}
                  {team.category && team.category !== 'Non-Seeded' && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-sm ${
                        team.category === 'Seeded A'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {team.category === 'Seeded A' ? 'SA' : 'SB'}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500/80 italic">Pemenang Babak Sebelum</span>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-1 relative z-10">
          {isAdmin && isWinner && onRequestUndoWinner ? (
            <button
              type="button"
              onClick={() => onRequestUndoWinner(rIdx, mIdx, teamProp)}
              className="px-1.5 py-1 text-emerald-300 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-all duration-300 cursor-pointer group flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20"
              title="Batalkan Kemenangan"
            >
              <Check size={14} className="group-hover:hidden" />
              <span className="hidden group-hover:inline text-[10px] font-bold text-rose-400 flex items-center gap-0.5">
                <X size={12} /> Batal
              </span>
            </button>
          ) : isAdmin && !isBye && team && !isWinner && onSelectWinner ? (
            <button
              type="button"
              onClick={() => onSelectWinner(rIdx, mIdx, teamProp)}
              className="p-1.5 bg-slate-800/50 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700 border border-transparent hover:border-amber-500/30 hover:scale-110 transition-all duration-300 cursor-pointer shadow-sm"
              title="Pilih Sebagai Pemenang"
            >
              <Trophy size={14} />
            </button>
          ) : isWinner ? (
            <div className="px-1.5 py-1 text-emerald-300 rounded flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20">
              <Check size={14} />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const hasBye = (match.t1?.id === 'BYE' || match.t2?.id === 'BYE') && !isFinal;
  
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const isToday = match.schedule?.date === getTodayDate();

  return (
    <div className="match-card relative w-[260px] group">
      {/* Pita Mengambang HARI INI di Tengah */}
      {isToday && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)] z-20 border-2 border-slate-900 animate-[bounce_2s_infinite]">
          🔥 HARI INI
        </div>
      )}

      <div
        className={`backdrop-blur-md border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 w-full h-full relative z-10 group-hover:border-slate-400/80 group-hover:shadow-2xl ${
          isFinal
            ? 'bg-gradient-to-br from-slate-900/95 to-amber-950/80 border-amber-500/50 shadow-amber-500/20'
            : match.winner
            ? 'bg-gradient-to-br from-slate-900/95 to-emerald-950/60 border-emerald-500/50 shadow-emerald-500/20'
            : 'bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-slate-700/60'
        }`}
      >
        {/* Schedule Header */}
      {!hasBye && (
        <div className="bg-slate-950/40 border-b border-slate-700/50 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] backdrop-blur-sm">
          <div className="flex items-center gap-1 flex-1 min-w-0 text-slate-400" title="Tanggal">
            <FormattedDateInput
              value={match.schedule.date || ''}
              onChange={(val) => onUpdateSchedule(rIdx, mIdx, 'date', val)}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0" title="Lapangan">
            <select
              value={match.schedule.court || ''}
              onChange={(e) => onUpdateSchedule(rIdx, mIdx, 'court', e.target.value)}
              className="bg-slate-900/50 text-slate-200 border border-slate-700/50 rounded px-1 py-0.5 text-[10px] outline-none hover:bg-slate-800/50 focus:bg-slate-800 transition-colors cursor-pointer"
            >
              <option value="">- Lap -</option>
              {courtsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 shrink-0" title="Partai Ke-">
            <select
              value={match.schedule.matchNum || ''}
              onChange={(e) => onUpdateSchedule(rIdx, mIdx, 'matchNum', e.target.value)}
              className="bg-slate-900/50 text-slate-200 border border-slate-700/50 rounded px-1 py-0.5 text-[10px] outline-none hover:bg-slate-800/50 focus:bg-slate-800 transition-colors cursor-pointer"
            >
              <option value="">- Ke -</option>
              {Array.from({ length: 5 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Ke-{i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Final Special Banner */}
      {isFinal && (
        <div className="bg-gradient-to-r from-amber-500/30 via-amber-400/40 to-amber-500/30 text-amber-200 border-b border-amber-500/50 text-[10px] font-black py-1.5 px-2 text-center uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(251,191,36,0.1)] relative z-10 backdrop-blur-md">
          <Trophy size={13} className="text-amber-300 drop-shadow-md" /> Perebutan Juara 1 & 2
        </div>
      )}

      {/* Match Slots */}
      <div className="relative">
        {isToday && match.winner && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 text-emerald-500/85 border-[3px] border-emerald-500/85 text-xl font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] pointer-events-none z-30 backdrop-blur-[1px] shadow-[0_0_15px_rgba(16,185,129,0.3),inset_0_0_10px_rgba(16,185,129,0.2)]" style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}>
              SELESAI
            </div>
        )}
        {renderSlot('t1', slotNumber1)}
        {renderSlot('t2', slotNumber2)}
      </div>
      </div>
    </div>
  );
};
