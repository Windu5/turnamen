import React, { useRef, useEffect } from 'react';
import { Match, Team, BracketLayoutMode } from '../types';
import { MatchCard } from './MatchCard';
import { getRoundName } from '../utils/bracketUtils';

interface BracketCanvasProps {
  rounds: Match[][];
  teams: Team[];
  layoutMode: BracketLayoutMode;
  zoomLevel: number;
  activeFilter: string;
  onSelectTeamSlot: (
    rIdx: number,
    mIdx: number,
    teamProp: 't1' | 't2',
    teamId: string
  ) => void;
  onSelectWinner: (rIdx: number, mIdx: number, teamProp: 't1' | 't2') => void;
  onRequestUndoWinner: (
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
  isPresentationMode?: boolean;
  highlightedTeamId?: string | null;
  isAdmin?: boolean;
}

export const BracketCanvas: React.FC<BracketCanvasProps> = ({
  rounds,
  teams,
  layoutMode,
  zoomLevel,
  activeFilter,
  onSelectTeamSlot,
  onSelectWinner,
  onRequestUndoWinner,
  onUpdateSchedule,
  isPresentationMode = false,
  highlightedTeamId,
  isAdmin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scaleWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && scaleWrapperRef.current) {
      scaleWrapperRef.current.style.minWidth = `${containerRef.current.offsetWidth * zoomLevel}px`;
      scaleWrapperRef.current.style.minHeight = `${containerRef.current.offsetHeight * zoomLevel}px`;
    }
  }, [zoomLevel, rounds, layoutMode, activeFilter]);

  const totalRounds = rounds.length;

  if (totalRounds === 0) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium text-base">
        Belum ada bagan. Masukkan jumlah slot lalu klik <strong className="text-emerald-400">Buat Bagan Kosong</strong>.
      </div>
    );
  }

  // Calculate start round index based on round filter
  let startRoundIdx = 0;
  if (activeFilter !== 'all') {
    const showRounds = parseInt(activeFilter, 10);
    if (!isNaN(showRounds)) {
      startRoundIdx = totalRounds - showRounds;
      if (startRoundIdx < 0) startRoundIdx = 0;
    }
  }

  const usedTeamIds = React.useMemo(() => {
    const ids = new Set<string>();
    rounds.forEach((r) => {
      r.forEach((match) => {
        if (match.t1 && match.t1.id !== 'BYE') ids.add(match.t1.id);
        if (match.t2 && match.t2.id !== 'BYE') ids.add(match.t2.id);
      });
    });
    return ids;
  }, [rounds]);

  // Calculate slot numbers for Round 0 ignoring BYEs
  const visibleSlotNumbers = React.useMemo(() => {
    const map = new Map<string, number>();
    if (rounds.length === 0) return map;

    const isTwoSided = layoutMode === 'two-sided';
    const orderedSlots: { mIdx: number; teamProp: 't1' | 't2'; isBye: boolean }[] = [];
    
    if (isTwoSided) {
      const halfMatches = rounds[0].length / 2;
      for (let i = 0; i < halfMatches; i++) {
        orderedSlots.push({ mIdx: i, teamProp: 't1', isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ mIdx: i, teamProp: 't2', isBye: rounds[0][i].t2?.id === 'BYE' });
      }
      for (let i = halfMatches; i < rounds[0].length; i++) {
        orderedSlots.push({ mIdx: i, teamProp: 't1', isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ mIdx: i, teamProp: 't2', isBye: rounds[0][i].t2?.id === 'BYE' });
      }
    } else {
      for (let i = 0; i < rounds[0].length; i++) {
        orderedSlots.push({ mIdx: i, teamProp: 't1', isBye: rounds[0][i].t1?.id === 'BYE' });
        orderedSlots.push({ mIdx: i, teamProp: 't2', isBye: rounds[0][i].t2?.id === 'BYE' });
      }
    }

    let currentSlotNumber = 1;
    for (const slot of orderedSlots) {
      if (!slot.isBye) {
        map.set(`${slot.mIdx}-${slot.teamProp}`, currentSlotNumber);
        currentSlotNumber++;
      }
    }

    return map;
  }, [rounds, layoutMode]);

  const getSlotNumber = (mIdx: number, teamProp: 't1' | 't2') => {
    return visibleSlotNumbers.get(`${mIdx}-${teamProp}`);
  };

  const renderColumnMatches = (
    rIdx: number,
    matchList: Match[],
    startMIdxInRound = 0,
    isTwoSided = false
  ) => {
    const isFirstRound = rIdx === 0 && activeFilter === 'all';
    const isFinal = rIdx === totalRounds - 1;

    return (
      <div className="flex flex-col justify-around flex-1 py-4 relative h-full">
        {matchList.map((match, relativeIdx) => {
          const actualMIdx = startMIdxInRound + relativeIdx;
          let slot1 = isFirstRound
            ? getSlotNumber(actualMIdx, 't1')
            : undefined;
          let slot2 = isFirstRound
            ? getSlotNumber(actualMIdx, 't2')
            : undefined;
            
          const hasWinnerClass = match.winner ? ' has-winner' : '';
          const hasAdvancedT1 = (!isFirstRound && match.t1 && match.t1.id !== 'BYE') ? ' has-advanced-team-t1' : '';
          const hasAdvancedT2 = (!isFirstRound && match.t2 && match.t2.id !== 'BYE') ? ' has-advanced-team-t2' : '';
          const hasAdvancedAny = (!isFirstRound && ((match.t1 && match.t1.id !== 'BYE') || (match.t2 && match.t2.id !== 'BYE'))) ? ' has-advanced-team' : '';

          let playInHiddenClass = '';
          let playInShiftedClass = '';
          let isPlayInShifted = false;
          
          if (activeFilter === 'all' && rounds.length > 1) {
            if (rIdx === 0) {
              const siblingIdx = actualMIdx % 2 === 0 ? actualMIdx + 1 : actualMIdx - 1;
              const matchHasBye = match.t1?.id === 'BYE' || match.t2?.id === 'BYE';
              const sibling = rounds[0][siblingIdx];
              const siblingHasBye = sibling && (sibling.t1?.id === 'BYE' || sibling.t2?.id === 'BYE');
              if (matchHasBye && siblingHasBye) {
                playInHiddenClass = ' play-in-hidden';
              }
            } else if (rIdx === 1) {
              const feeder1 = rounds[0][actualMIdx * 2];
              const feeder2 = rounds[0][actualMIdx * 2 + 1];
              const f1HasBye = feeder1 && (feeder1.t1?.id === 'BYE' || feeder1.t2?.id === 'BYE');
              const f2HasBye = feeder2 && (feeder2.t1?.id === 'BYE' || feeder2.t2?.id === 'BYE');
              if (f1HasBye && f2HasBye) {
                isPlayInShifted = true;
                playInShiftedClass = ' play-in-shifted-wrapper';
                slot1 = getSlotNumber(actualMIdx * 2, feeder1.t1?.id === 'BYE' ? 't2' : 't1');
                slot2 = getSlotNumber(actualMIdx * 2 + 1, feeder2.t1?.id === 'BYE' ? 't2' : 't1');
              }
            }
          }

          const handleSlotSelect = (selectedRIdx: number, selectedMIdx: number, teamProp: 't1' | 't2', teamId: string) => {
            if (isPlayInShifted) {
              const feederMIdx = teamProp === 't1' ? actualMIdx * 2 : actualMIdx * 2 + 1;
              const feederMatch = rounds[0][feederMIdx];
              const feederTeamProp = feederMatch.t1?.id === 'BYE' ? 't2' : 't1';
              onSelectTeamSlot(0, feederMIdx, feederTeamProp, teamId);
            } else {
              onSelectTeamSlot(selectedRIdx, selectedMIdx, teamProp, teamId);
            }
          };

          return (
            <div id={`match-${rIdx}-${actualMIdx}`} key={match.id || relativeIdx} className={`flex flex-col justify-center flex-1 relative match-wrapper min-h-[160px] py-3${hasWinnerClass}${hasAdvancedT1}${hasAdvancedT2}${hasAdvancedAny}${playInHiddenClass}${playInShiftedClass}`}>
              <MatchCard
                match={match}
                rIdx={rIdx}
                mIdx={actualMIdx}
                isFirstRound={isFirstRound || isPlayInShifted}
                isFinal={isFinal}
                teams={teams}
                slotNumber1={slot1}
                slotNumber2={slot2}
                onSelectTeamSlot={onSelectTeamSlot}
                onSelectWinner={onSelectWinner}
                onRequestUndoWinner={onRequestUndoWinner}
                onUpdateSchedule={onUpdateSchedule}
                usedTeamIds={usedTeamIds}
                highlightedTeamId={highlightedTeamId}
                isAdmin={isAdmin}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      id="bracket-workspace"
      className={`workspace overflow-auto relative block w-full h-full bg-transparent ${
        isPresentationMode ? 'p-2' : 'p-6'
      } z-10`}
    >
      <div 
        id="scale-wrapper" 
        ref={scaleWrapperRef} 
        className="scale-wrapper origin-top-left"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <div
          id="bracket-container"
          ref={containerRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease-out',
          }}
          className="bracket-container flex justify-start items-stretch gap-12 p-4 w-max"
        >
          {layoutMode === 'one-sided' ? (
          /* One Sided Layout: Left to Right sequentially */
          <div className="flex items-stretch gap-12 layout-onesided">
            {Array.from({ length: totalRounds - startRoundIdx }).map((_, idx) => {
              const rIdx = startRoundIdx + idx;
              const roundMatches = rounds[rIdx];

              return (
                <div key={rIdx} className="flex flex-col w-[260px] shrink-0 bracket-column">
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-slate-300 font-bold text-xs uppercase tracking-wider py-2 px-3 text-center rounded-xl mb-4 shadow-lg ring-1 ring-white/5">
                    {getRoundName(rIdx, totalRounds)}
                  </div>
                  {renderColumnMatches(rIdx, roundMatches, 0, false)}
                </div>
              );
            })}
          </div>
        ) : (
          /* Two Sided Layout: Left Side, Center (Final), Right Side */
          <div className="flex items-stretch justify-center gap-12 mx-auto">
            {/* Left Side Rounds */}
            <div className="flex gap-12 items-stretch left-side">
              {Array.from({ length: totalRounds - 1 - startRoundIdx }).map((_, idx) => {
                const rIdx = startRoundIdx + idx;
                const roundMatches = rounds[rIdx];
                const halfCount = roundMatches.length / 2;
                const leftMatches = roundMatches.slice(0, halfCount);

                return (
                  <div key={`left-${rIdx}`} className="flex flex-col w-[260px] shrink-0 bracket-column">
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-slate-300 font-bold text-xs uppercase tracking-wider py-2 px-3 text-center rounded-xl mb-4 shadow-lg ring-1 ring-white/5">
                      {getRoundName(rIdx, totalRounds)}
                    </div>
                    {renderColumnMatches(rIdx, leftMatches, 0, true)}
                  </div>
                );
              })}
            </div>

            {/* Center Final Match */}
            {startRoundIdx < totalRounds && (
              <div className="flex flex-col justify-center items-center w-[260px] shrink-0 my-auto bracket-center">
                <div className="bracket-column has-sides flex flex-col items-center">
                  <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-300 font-extrabold text-xs uppercase tracking-widest py-2 px-4 text-center rounded-xl mb-4 shadow-[0_4px_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30">
                    🏆 FINAL CHAMPIONSHIP
                  </div>
                  {renderColumnMatches(
                    totalRounds - 1,
                    [rounds[totalRounds - 1][0]],
                    0,
                    true
                  )}
                </div>
              </div>
            )}

            {/* Right Side Rounds (Reversed order for 2-sided perspective) */}
            <div className="flex gap-12 items-stretch flex-row-reverse right-side">
              {Array.from({ length: totalRounds - 1 - startRoundIdx }).map((_, idx) => {
                const rIdx = startRoundIdx + idx;
                const roundMatches = rounds[rIdx];
                const halfCount = roundMatches.length / 2;
                const rightMatches = roundMatches.slice(halfCount);

                return (
                  <div key={`right-${rIdx}`} className="flex flex-col w-[260px] shrink-0 bracket-column">
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-slate-300 font-bold text-xs uppercase tracking-wider py-2 px-3 text-center rounded-xl mb-4 shadow-lg ring-1 ring-white/5">
                      {getRoundName(rIdx, totalRounds)}
                    </div>
                    {renderColumnMatches(rIdx, rightMatches, halfCount, true)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
