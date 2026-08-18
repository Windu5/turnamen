import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Sparkles, X } from 'lucide-react';
import { Team } from '../types';

interface ChampionModalProps {
  champion: Team | null;
  runnerUp: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChampionModal: React.FC<ChampionModalProps> = ({
  champion,
  runnerUp,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && champion) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, champion]);

  if (!isOpen || !champion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Decorative ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl text-amber-400 mb-4 shadow-lg shadow-amber-500/20 animate-bounce">
          <Trophy size={42} />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
          <Sparkles size={14} /> CHAMPION MAHAP OPEN 2026 <Sparkles size={14} />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          {champion.name}
        </h2>

        {champion.category && (
          <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold rounded-full mb-6">
            {champion.category}
          </span>
        )}

        {/* Podium box */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 my-4 flex flex-col gap-3">
          <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🥇</span>
              <div className="text-left">
                <div className="text-xs text-amber-400 font-semibold uppercase">Juara 1</div>
                <div className="text-sm font-bold text-slate-100">{champion.name}</div>
              </div>
            </div>
            <Award className="text-amber-400" size={20} />
          </div>

          {runnerUp && (
            <div className="flex items-center justify-between p-2.5 bg-slate-700/40 border border-slate-600/40 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">🥈</span>
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Juara 2 (Runner-Up)</div>
                  <div className="text-sm font-bold text-slate-200">{runnerUp.name}</div>
                </div>
              </div>
              <Award className="text-slate-400" size={20} />
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          Tutup & Lihat Bagan Complete
        </button>
      </div>
    </div>
  );
};
