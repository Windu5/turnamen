import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Edit2,
  Check,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Match, Team } from '../types';
import { getRoundName } from '../utils/bracketUtils';

interface ScheduleViewProps {
  rounds: Match[][];
  teams: Team[];
  onUpdateScore?: (rIdx: number, mIdx: number, score1: string, score2: string) => void;
  onUpdateSchedule?: (
    rIdx: number,
    mIdx: number,
    field: 'date' | 'court' | 'matchNum',
    val: string
  ) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

interface FlattenedMatch {
  rIdx: number;
  mIdx: number;
  roundName: string;
  match: Match;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  rounds,
  teams,
  onUpdateScore,
  onUpdateSchedule,
  onRefresh,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Return today's date in YYYY-MM-DD format (local timezone)
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [scoreInput1, setScoreInput1] = useState('');
  const [scoreInput2, setScoreInput2] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => (window.innerWidth < 640 ? 0.6 : 1.0));

  const handleRefreshClick = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const totalRounds = rounds.length;

  // Flatten all matches
  const allMatches: FlattenedMatch[] = [];
  rounds.forEach((round, rIdx) => {
    round.forEach((match, mIdx) => {
      // Only include matches that have at least one team or are relevant
      if (match.t1 || match.t2) {
        allMatches.push({
          rIdx,
          mIdx,
          roundName: getRoundName(rIdx, totalRounds),
          match,
        });
      }
    });
  });

  // Get all unique dates from matches
  const availableDates = Array.from(
    new Set(allMatches.map(m => m.match.schedule.date).filter(Boolean))
  ).sort() as string[];

  // Filter matches
  const filteredMatches = allMatches.filter(({ match, roundName }) => {
    const t1Name = match.t1 ? match.t1.name : '';
    const t2Name = match.t2 ? match.t2.name : '';
    const query = searchQuery.toLowerCase();

    const matchQuery =
      t1Name.toLowerCase().includes(query) ||
      t2Name.toLowerCase().includes(query) ||
      roundName.toLowerCase().includes(query) ||
      (match.schedule.court && match.schedule.court.toLowerCase().includes(query));

    const matchDate =
      selectedDate === 'all' || match.schedule.date === selectedDate;

    return matchQuery && matchDate;
  });

  // Sort: 1. Date, 2. Match Num, 3. Court
  filteredMatches.sort((a, b) => {
    const dateA = a.match.schedule.date || '';
    const dateB = b.match.schedule.date || '';
    
    if (dateA !== dateB) {
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    }

    const numA = parseInt(a.match.schedule.matchNum || '9999', 10);
    const numB = parseInt(b.match.schedule.matchNum || '9999', 10);
    if (numA !== numB) {
      return numA - numB;
    }

    const courtA = a.match.schedule.court || '';
    const courtB = b.match.schedule.court || '';
    return courtA.localeCompare(courtB);
  });

  const handleEditScore = (item: FlattenedMatch) => {
    setEditingScoreId(item.match.id || `${item.rIdx}-${item.mIdx}`);
    setScoreInput1(item.match.score1 || '');
    setScoreInput2(item.match.score2 || '');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}-${month}-${year}`;
  };

  const handleSaveScore = (rIdx: number, mIdx: number) => {
    onUpdateScore?.(rIdx, mIdx, scoreInput1.trim(), scoreInput2.trim());
    setEditingScoreId(null);
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="text-amber-400" size={20} />
              Jadwal & Hasil Pertandingan ({filteredMatches.length})
            </h2>
          </div>
          <p className="hidden sm:block text-xs text-slate-400 mt-1">
            Daftar partai pertandingan yang sudah memiliki tanggal pelaksanaan, pengaturan lapangan, dan catatan skor.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Search */}
          <div className="hidden sm:block relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tim, babak..."
              className="bg-slate-900 border border-slate-700 text-slate-100 text-xs pl-8 pr-3 py-2 rounded-lg outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar size={13} className="text-amber-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-slate-100 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Semua Tanggal</option>
              {availableDates.map(date => (
                <option key={date} value={date} className="bg-slate-900">
                  {formatDate(date)}
                </option>
              ))}
              {/* Ensure today's date is an option if it's not in availableDates but selected */}
              {!availableDates.includes(selectedDate) && selectedDate !== 'all' && (
                <option value={selectedDate} className="bg-slate-900">
                  {formatDate(selectedDate)} (Hari Ini)
                </option>
              )}
            </select>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshClick}
              className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow"
              title="Refresh Jadwal"
            >
              <svg className={`${isRefreshing ? 'animate-spin text-white' : ''} transition-colors`} xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:flex px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors items-center gap-1.5 cursor-pointer shadow"
          >
            <Printer size={14} /> Cetak Jadwal
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400 text-sm space-y-2">
            <Calendar size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Belum ada jadwal pertandingan yang dapat ditampilkan.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada pertandingan yang dijadwalkan pada {selectedDate !== 'all' ? 'tanggal ini' : 'kriteria ini'}. Silakan ganti filter tanggal atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative min-h-[300px]">
            <div 
              className="origin-top-left transition-transform duration-300 inline-block min-w-full"
              style={{ transform: `scale(${zoomLevel})`, width: `${100 / zoomLevel}%` }}
            >
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-700">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 w-16 text-center">Partai</th>
                  <th className="py-3 px-4">Tim 1</th>
                  <th className="py-3 px-4 text-center w-12">VS</th>
                  <th className="py-3 px-4">Tim 2</th>
                  <th className="py-3 px-4">Lapangan</th>
                  <th className="py-3 px-4 text-center">Skor Set</th>
                  <th className="py-3 px-4 text-center">Pemenang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredMatches.map((item) => {
                  const { rIdx, mIdx, roundName, match } = item;
                  const isWinner1 = match.winner && match.t1 && match.winner.id === match.t1.id;
                  const isWinner2 = match.winner && match.t2 && match.winner.id === match.t2.id;
                  const matchId = match.id || `${rIdx}-${mIdx}`;
                  const isEditingScore = editingScoreId === matchId;

                  return (
                    <tr
                      key={matchId}
                      className="hover:bg-slate-700/40 transition-colors"
                    >
                      <td className={`py-3 px-4 text-xs transition-colors ${match.winner ? 'bg-emerald-500/10 border-l-[5px] border-l-emerald-500' : 'text-slate-400'}`}>
                        {match.winner ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">✔️ SELESAI</span>
                            <span className="font-bold text-[13px] text-slate-200">{formatDate(match.schedule.date)}</span>
                          </div>
                        ) : (
                          <span>{formatDate(match.schedule.date)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        {match.schedule.matchNum ? `#${match.schedule.matchNum}` : '-'}
                      </td>
                      <td className={`py-3 px-4 font-bold ${isWinner1 ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {match.t1 ? match.t1.name : '---'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-bold text-xs">
                        VS
                      </td>
                      <td className={`py-3 px-4 font-bold ${isWinner2 ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {match.t2 ? match.t2.name : '---'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs">
                          <MapPin size={11} className="text-amber-400" />
                          {match.schedule.court || 'TBA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {isAdmin && isEditingScore ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              value={scoreInput1}
                              onChange={(e) => setScoreInput1(e.target.value)}
                              placeholder="21"
                              className="w-10 bg-slate-900 border border-amber-500 text-slate-100 text-xs text-center rounded p-1"
                            />
                            <span>-</span>
                            <input
                              type="text"
                              value={scoreInput2}
                              onChange={(e) => setScoreInput2(e.target.value)}
                              placeholder="18"
                              className="w-10 bg-slate-900 border border-amber-500 text-slate-100 text-xs text-center rounded p-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveScore(rIdx, mIdx)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 cursor-pointer"
                              title="Simpan Skor"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={isAdmin ? () => handleEditScore(item) : undefined}
                            className={`inline-flex items-center gap-1 transition-colors ${isAdmin ? 'cursor-pointer hover:text-amber-400' : ''}`}
                            title={isAdmin ? "Klik untuk ubah skor" : ""}
                          >
                            <span>
                              {match.score1 || match.score2
                                ? `${match.score1 || 0} - ${match.score2 || 0}`
                                : '-'}
                            </span>
                            {isAdmin && <Edit2 size={11} className="text-slate-500" />}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {match.winner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-md">
                            <CheckCircle2 size={12} />
                            {match.winner.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                            <Clock size={12} /> Belum Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
