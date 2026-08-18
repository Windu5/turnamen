const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Dices, Users } from 'lucide-react';
import { Team, Match } from '../types';

interface ManualDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  bracketSize: number;
  rounds: Match[][];
  onApplyDraw: (results: Record<string, number>) => void;
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
  onApplyDraw,
}) => {
  const [drawResults, setDrawResults] = useState<Record<string, number>>({});
  const [drawingTeam, setDrawingTeam] = useState<Team | null>(null);
  const [flashingNumber, setFlashingNumber] = useState<number | null>(null);
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [isFinishedFlashing, setIsFinishedFlashing] = useState(false);

  const drawIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Calculate occupied slots from the current bracket
  const getOccupiedSlots = () => {
    const occupied = new Set<number>();
    if (rounds.length > 0) {
      const round0 = rounds[0];
      for (let m = 0; m < round0.length; m++) {
        if (round0[m].t1 !== null) occupied.add(m * 2);
        if (round0[m].t2 !== null) occupied.add(m * 2 + 1);
      }
    }
    return occupied;
  };

  // Find teams that haven't been drawn and aren't already in the bracket
  const getAvailableTeams = () => {
    const occupiedByBracket = new Set<string>();
    if (rounds.length > 0) {
      const round0 = rounds[0];
      round0.forEach((m) => {
        if (m.t1 && m.t1.id !== 'BYE') occupiedByBracket.add(m.t1.id);
        if (m.t2 && m.t2.id !== 'BYE') occupiedByBracket.add(m.t2.id);
      });
    }
    return teams.filter(t => !occupiedByBracket.has(t.id));
  };

  const handleDraw = (team: Team) => {
    if (drawingTeam) return;

    const seedPositions = getSeedPositions(bracketSize);
    const occupiedInBracket = getOccupiedSlots();
    const drawnSlots = new Set(Object.values(drawResults));

    const availableTeams = getAvailableTeams();
    const seededA = availableTeams.filter((t) => t.category === 'Seeded A');
    const seededB = availableTeams.filter((t) => t.category === 'Seeded B');

    const availableSeedPositions = seedPositions.filter(
      (s) => !occupiedInBracket.has(s) && !drawnSlots.has(s)
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
      const allSlots = Array.from({ length: bracketSize }, (_, i) => i);
      availableSlots = allSlots.filter(
        (s) => !occupiedInBracket.has(s) && !drawnSlots.has(s)
      );
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
      const randomDisplay = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      setFlashingNumber(randomDisplay);

      if (counter >= duration) {
        if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
        const finalSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        
        setFlashingNumber(finalSlot);
        setIsFinishedFlashing(true);
        
        // Pause for 1.5s to show the final result, then close
        timeoutRef.current = window.setTimeout(() => {
          setDrawResults((prev) => ({ ...prev, [team.id]: finalSlot }));
          setDrawingTeam(null);
          setFlashingNumber(null);
          setIsMiniModalOpen(false);
        }, 1500);
      }
    }, intervalTime);
  };

  const handleApply = () => {
    onApplyDraw(drawResults);
    onClose();
  };

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setDrawResults({});
      setDrawingTeam(null);
      setFlashingNumber(null);
      setIsMiniModalOpen(false);
    }
    return () => {
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const availableTeams = getAvailableTeams();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
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
              <div className="grid gap-3">
                {availableTeams.map((team) => {
                  const hasDrawn = drawResults[team.id] !== undefined;
                  const isDrawingThis = drawingTeam?.id === team.id;
                  
                  return (
                    <div key={team.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{team.name}</div>
                          <div className={\`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-semibold \${
                            team.category === 'Seeded A' ? 'bg-amber-500/20 text-amber-400' :
                            team.category === 'Seeded B' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-700 text-slate-300'
                          }\`}>
                            {team.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {isDrawingThis ? (
                          <div className="w-32 h-10 rounded-lg bg-indigo-600/50 flex items-center justify-center text-indigo-200 font-semibold italic shadow-inner">
                            Mengundi...
                          </div>
                        ) : hasDrawn ? (
                          <div className="w-32 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                            Slot {drawResults[team.id] + 1}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDraw(team)}
                            disabled={drawingTeam !== null}
                            className="w-32 h-10 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                          >
                            <Dices size={16} className="group-hover:animate-spin" />
                            Cabut
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              disabled={Object.keys(drawResults).length === 0 || drawingTeam !== null}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
            >
              <Trophy size={18} />
              Masukkan ke Skema
            </button>
          </div>

        </div>
      </div>

      {/* Mini Suspense Modal */}
      {isMiniModalOpen && drawingTeam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 md:p-12 flex flex-col items-center shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-in zoom-in duration-300">
            <h3 className="text-xl md:text-2xl text-slate-400 mb-2 font-medium">Mengundi Slot Untuk</h3>
            <div className="text-3xl md:text-5xl font-black text-white mb-10 text-center tracking-tight">
              {drawingTeam.name}
            </div>
            
            <div className={\`w-48 h-48 md:w-64 md:h-64 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300 \${
              isFinishedFlashing 
                ? 'border-emerald-500 bg-emerald-900/30 shadow-[0_0_80px_rgba(16,185,129,0.6)] scale-110' 
                : 'border-indigo-500 bg-slate-800 shadow-[0_0_40px_rgba(79,70,229,0.5)]'
            }\`}>
              <span className={\`font-black tabular-nums transition-colors \${
                isFinishedFlashing ? 'text-7xl md:text-9xl text-emerald-400' : 'text-6xl md:text-8xl text-white'
              }\`}>
                {flashingNumber !== null ? flashingNumber + 1 : '?'}
              </span>
            </div>
            
            <div className="mt-8 text-slate-500 font-medium tracking-widest uppercase text-sm">
              {isFinishedFlashing ? 'Hasil Pengundian' : 'Mengacak Nomor...'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
`;

fs.writeFileSync('src/components/ManualDrawModal.tsx', code);
