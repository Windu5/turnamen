import React, { useState, useEffect } from 'react';
import { Shuffle, Check, Sparkles, X, Play, RotateCcw } from 'lucide-react';
import { Team } from '../types';
import { generateSeededSlotAssignments } from '../utils/bracketUtils';

interface LiveDrawModalProps {
  isOpen: boolean;
  teams: Team[];
  bracketSize: number;
  onClose: () => void;
  onApplyDraw: (slotAssignments: (Team | null)[], bracketSize: number) => void;
}

export const LiveDrawModal: React.FC<LiveDrawModalProps> = ({
  isOpen,
  teams,
  bracketSize,
  onClose,
  onApplyDraw,
}) => {
  const [selectedSize, setSelectedSize] = useState<number>(bracketSize);
  const [slots, setSlots] = useState<(Team | null)[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeShuffleIndex, setActiveShuffleIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSize(bracketSize);
      // Generate initial draw
      const initial = generateSeededSlotAssignments(teams, bracketSize);
      setSlots(initial);
    }
  }, [isOpen, bracketSize, teams]);

  if (!isOpen) return null;

  const handleStartShuffling = () => {
    setIsShuffling(true);

    let count = 0;
    const interval = setInterval(() => {
      // Create random shuffle iteration
      const randomDraw = generateSeededSlotAssignments(teams, selectedSize);
      setSlots(randomDraw);
      setActiveShuffleIndex(Math.floor(Math.random() * selectedSize));
      count++;

      if (count >= 15) {
        clearInterval(interval);
        // Final draw result
        const finalDraw = generateSeededSlotAssignments(teams, selectedSize);
        setSlots(finalDraw);
        setIsShuffling(false);
        setActiveShuffleIndex(null);
      }
    }, 120);
  };

  const handleApply = () => {
    onApplyDraw(slots, selectedSize);
    onClose();
  };

  const seededACount = teams.filter((t) => t.category === 'Seeded A').length;
  const seededBCount = teams.filter((t) => t.category === 'Seeded B').length;
  const nonSeededCount = teams.filter((t) => t.category === 'Non-Seeded').length;
  const byeCount = Math.max(0, selectedSize - teams.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl text-slate-100 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Shuffle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                Simulasi Live Draw & Acak Pot Turnamen
                <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Pengacakan otomatis dengan penyebaran Seeded A & Seeded B di bagan berlawanan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Control Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Ukuran Bagan Target:</span>
            <select
              value={selectedSize}
              onChange={(e) => {
                const newSz = parseInt(e.target.value, 10);
                setSelectedSize(newSz);
                setSlots(generateSeededSlotAssignments(teams, newSz));
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 font-bold px-2 py-1 rounded outline-none"
            >
              {[4, 8, 16, 32, 64, 128].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} Slot
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold rounded">
              A: {seededACount}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold rounded">
              B: {seededBCount}
            </span>
            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 font-semibold rounded">
              Non: {nonSeededCount}
            </span>
            <span className="px-2 py-0.5 bg-slate-900 text-slate-400 font-semibold rounded border border-slate-700">
              BYE: {byeCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartShuffling}
              disabled={isShuffling}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play size={13} />
              {isShuffling ? 'Mengacak...' : 'Mulai Acak Pot'}
            </button>
          </div>
        </div>

        {/* Slot Grid Result */}
        <div className="flex-1 overflow-y-auto border border-slate-700/80 rounded-xl p-3 bg-slate-950/60 my-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {slots.map((team, idx) => {
              const isHighlight = activeShuffleIndex === idx;
              const isBye = team && team.id === 'BYE';

              let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
              if (team && team.category === 'Seeded A') {
                badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              } else if (team && team.category === 'Seeded B') {
                badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
              }

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                    isHighlight
                      ? 'border-amber-400 bg-amber-500/20 scale-102 shadow-lg shadow-amber-500/20'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`font-bold truncate ${
                        isBye ? 'text-slate-500 italic' : 'text-slate-100'
                      }`}
                    >
                      {team ? team.name : '---'}
                    </span>
                  </div>

                  {team && team.category && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${badgeColor}`}>
                      {team.category}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/80 mt-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-950/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={15} />
            Terapkan Ke Bagan Pertandingan
          </button>
        </div>
      </div>
    </div>
  );
};
