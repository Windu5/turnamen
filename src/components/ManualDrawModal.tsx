import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Dices, Users } from 'lucide-react';
import { Team, Match, BracketLayoutMode } from '../types';

interface ManualDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  bracketSize: number;
  rounds: Match[][];
  layoutMode: BracketLayoutMode;
  isHidden?: boolean;
  onApplySingleDraw: (teamId: string, slotAbsoluteIndex: number) => void;
}

// Re-implement getSeedPositions here for self-containment
function getSeedPositions(bracketSize: number): number[] {
  const positions: number[] = [];
  if (bracketSize >= 2) positions.push(0, bracketSize - 1);
  if (bracketSize >= 4) positions.push(Math.floor(bracketSize / 2) - 1, Math.floor(bracketSize / 2));
  if (bracketSize >= 8) {
    const q1 = Math.floor(bracketSize / 4);
    const q3 = Math.floor((3 * bracketSize) / 4);
    positions.push(q1 - 1, q1, q3 - 1, q3);
  }
  for (let i = 0; i < bracketSize; i++) {
    if (!positions.includes(i)) positions.push(i);
  }
  return positions;
}

export const ManualDrawModal: React.FC<ManualDrawModalProps> = ({
  isOpen,
  onClose,
  teams,
  bracketSize,
  rounds,
  layoutMode,
  isHidden = false,
  onApplySingleDraw,
}) => {
  const [drawingTeam, setDrawingTeam] = useState<Team | null>(null);
  const [flashingNumber, setFlashingNumber] = useState<number | null>(null);
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [isFinishedFlashing, setIsFinishedFlashing] = useState(false);

  const drawIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const absoluteToVisualSlotMap = React.useMemo(() => {
    const map = new Map<number, number>();
    if (rounds.length === 0) return map;

    const isTwoSided = layoutMode === 'two-sided';
    const orderedSlots: { absoluteIdx: number; isBye: boolean }[] = [];
    
    if (isTwoSided) {
      const halfMatches = rounds[0].length / 2;
      for (let i = 0; i < halfMatches; i++) {
        orderedSlots.push({ absoluteIdx: i * 2, isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ absoluteIdx: i * 2 + 1, isBye: rounds[0][i].t2?.id === 'BYE' });
      }
      for (let i = halfMatches; i < rounds[0].length; i++) {
        orderedSlots.push({ absoluteIdx: i * 2, isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ absoluteIdx: i * 2 + 1, isBye: rounds[0][i].t2?.id === 'BYE' });
      }
    } else {
      for (let i = 0; i < rounds[0].length; i++) {
        orderedSlots.push({ absoluteIdx: i * 2, isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ absoluteIdx: i * 2 + 1, isBye: rounds[0][i].t2?.id === 'BYE' });
      }
    }

    let currentSlotNumber = 1;
    for (const slot of orderedSlots) {
      if (!slot.isBye) {
        map.set(slot.absoluteIdx, currentSlotNumber);
        currentSlotNumber++;
      }
    }

    return map;
  }, [rounds, layoutMode]);

  const getVisualSlot = (absoluteIdx: number | null) => {
    if (absoluteIdx === null) return '?';
    return absoluteToVisualSlotMap.get(absoluteIdx) || (absoluteIdx + 1);
  };

  // Calculate occupied slots from the current bracket
  const getOccupiedSlots = () => {
    const occupied = new Set<number>();
    for (let r = 0; r < rounds.length; r++) {
      for (let m = 0; m < rounds[r].length; m++) {
        const match = rounds[r][m];
        const span = Math.pow(2, r);
        if (match.t1 !== null) {
          const baseSlot = (m * 2) * span;
          for (let i = 0; i < span; i++) occupied.add(baseSlot + i);
        }
        if (match.t2 !== null) {
          const baseSlot = (m * 2 + 1) * span;
          for (let i = 0; i < span; i++) occupied.add(baseSlot + i);
        }
      }
    }
    return occupied;
  };

  // Find teams that haven't been drawn and aren't already in the bracket
  const getAvailableTeams = () => {
    const occupiedByBracket = new Set<string>();
    rounds.forEach((r) => {
      r.forEach((m) => {
        if (m.t1 && m.t1.id !== 'BYE') occupiedByBracket.add(m.t1.id);
        if (m.t2 && m.t2.id !== 'BYE') occupiedByBracket.add(m.t2.id);
      });
    });
    return teams.filter(t => !occupiedByBracket.has(t.id));
  };

  const getDrawnSlotForTeam = (teamId: string): number | null => {
    for (let r = 0; r < rounds.length; r++) {
      for (let m = 0; m < rounds[r].length; m++) {
        const span = Math.pow(2, r);
        if (rounds[r][m].t1?.id === teamId) return (m * 2) * span;
        if (rounds[r][m].t2?.id === teamId) return (m * 2 + 1) * span;
      }
    }
    return null;
  };

  const handleDraw = (team: Team) => {
    if (drawingTeam) return;

    const seedPositions = getSeedPositions(bracketSize);
    const occupiedInBracket = getOccupiedSlots();

    const availableTeams = getAvailableTeams();
    const seededA = availableTeams.filter((t) => t.category === 'Seeded A');
    const seededB = availableTeams.filter((t) => t.category === 'Seeded B');

    const availableSeedPositions = seedPositions.filter(
      (s) => !occupiedInBracket.has(s)
    );

    const allSlots = Array.from({ length: bracketSize }, (_, i) => i);
    const allAvailableSlots = allSlots.filter(
      (s) => !occupiedInBracket.has(s)
    );

    let targetPool: number[] = [];
    if (team.category === 'Seeded A') {
      targetPool = availableSeedPositions.slice(0, seededA.length);
    } else if (team.category === 'Seeded B') {
      targetPool = availableSeedPositions.slice(seededA.length, seededA.length + seededB.length);
    } else {
      targetPool = availableSeedPositions.slice(seededA.length + seededB.length);
    }

    let availableSlots = targetPool;

    if (availableSlots.length === 0) {
      availableSlots = allAvailableSlots;
    }

    if (availableSlots.length === 0) {
      alert('Tidak ada slot kosong yang tersedia!');
      return;
    }

    setDrawingTeam(team);
    setIsMiniModalOpen(true);
    setIsFinishedFlashing(false);
    setFlashingNumber(availableSlots[0]);

    let counter = 0;
    const duration = 2000; // 2 seconds animation
    const intervalTime = 60;

    drawIntervalRef.current = window.setInterval(() => {
      counter += intervalTime;
      const randomDisplay = allAvailableSlots[Math.floor(Math.random() * allAvailableSlots.length)];
      setFlashingNumber(randomDisplay);

      if (counter >= duration) {
        if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
        const finalSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        
        setFlashingNumber(finalSlot);
        setIsFinishedFlashing(true);
        
        // Pause for 1.5s to show the final result, then apply and hide
        timeoutRef.current = window.setTimeout(() => {
          onApplySingleDraw(team.id, finalSlot);
        }, 1500);
      }
    }, intervalTime);
  };

  // Reset state when opened or un-hidden
  useEffect(() => {
    if (isOpen && !isHidden) {
      setDrawingTeam(null);
      setFlashingNumber(null);
      setIsMiniModalOpen(false);
    }
    return () => {
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, isHidden]);

  if (!isOpen) return null;

  const availableTeams = getAvailableTeams();

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Dices size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Daftar Tim Belum Diundi</h2>
                <p className="text-sm text-slate-400">Cabut undi tim satu per satu</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {availableTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Semua Tim Sudah Terplot</h3>
                <p className="text-slate-400">Seluruh tim saat ini sudah ditempatkan di dalam bagan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-700/50 rounded-xl bg-slate-800/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50 text-slate-400 text-xs">
                      <th className="py-2 px-4 font-medium w-12 text-center">No</th>
                      <th className="py-2 px-4 font-medium">Nama Tim</th>
                      <th className="py-2 px-4 font-medium">Kategori</th>
                      <th className="py-2 px-4 font-medium text-center w-32">Status / Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {teams.map((team, index) => {
                      const isDrawingThis = drawingTeam?.id === team.id;
                      const drawnSlot = getDrawnSlotForTeam(team.id);
                      const hasDrawn = drawnSlot !== null;
                      
                      return (
                        <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-4 text-center text-slate-500 text-sm">{index + 1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-200 text-sm">
                            {team.name}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold ${
                              team.category === 'Seeded A' ? 'bg-amber-500/20 text-amber-400' :
                              team.category === 'Seeded B' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {team.category}
                            </span>
                          </td>
                          <td className="py-2 px-4 flex justify-center">
                            {isDrawingThis ? (
                              <div className="w-28 h-8 rounded-md bg-indigo-600/50 flex items-center justify-center text-indigo-200 font-semibold italic text-xs shadow-inner">
                                Mengundi...
                              </div>
                            ) : hasDrawn ? (
                              <div className="w-28 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                Slot {getVisualSlot(drawnSlot)}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDraw(team)}
                                disabled={drawingTeam !== null}
                                className="w-28 h-8 rounded-md bg-slate-700 hover:bg-indigo-600 text-slate-200 font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 group"
                              >
                                <Dices size={14} className="group-hover:animate-spin" />
                                Cabut
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Selesai / Tutup
            </button>
          </div>

        </div>
      </div>

      {/* Mini Suspense Modal */}
      {isMiniModalOpen && drawingTeam && !isHidden && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 md:p-12 flex flex-col items-center shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-in zoom-in duration-300">
            <h3 className="text-xl md:text-2xl text-slate-400 mb-2 font-medium">Mengundi Slot Untuk</h3>
            <div className="text-3xl md:text-5xl font-black text-white mb-10 text-center tracking-tight">
              {drawingTeam.name}
            </div>
            
            <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
              isFinishedFlashing 
                ? 'border-emerald-500 bg-emerald-900/30 shadow-[0_0_80px_rgba(16,185,129,0.6)] scale-110' 
                : 'border-indigo-500 bg-slate-800 shadow-[0_0_40px_rgba(79,70,229,0.5)]'
            }`}>
              {flashingNumber !== null && (
                <span className={`text-sm md:text-xl font-bold tracking-widest mb-1 md:mb-2 ${isFinishedFlashing ? 'text-emerald-500' : 'text-indigo-400'}`}>
                  SLOT
                </span>
              )}
              <span className={`font-black tabular-nums transition-colors leading-none ${
                isFinishedFlashing ? 'text-7xl md:text-9xl text-emerald-400' : 'text-6xl md:text-8xl text-white'
              }`}>
                {getVisualSlot(flashingNumber)}
              </span>
            </div>
            
            <div className="mt-8 text-slate-400 font-medium tracking-widest uppercase text-sm md:text-base text-center">
              {isFinishedFlashing ? 'Posisi di Bagan Pertandingan' : 'Mengacak Posisi Slot...'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
