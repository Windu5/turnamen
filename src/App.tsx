/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { ParticipantManager } from './components/ParticipantManager';
import { BracketToolbar } from './components/BracketToolbar';
import { BracketCanvas } from './components/BracketCanvas';
import { ScheduleView } from './components/ScheduleView';
import { ConfirmModal } from './components/ConfirmModal';
import { ChampionModal } from './components/ChampionModal';
import { LiveDrawModal } from './components/LiveDrawModal';
import { ManualDrawModal } from './components/ManualDrawModal';
import {
  Team,
  Match,
  CategoryType,
  BracketLayoutMode,
} from './types';
import {
  createEmptyBracketRounds,
  selectWinnerInRounds,
  undoWinnerInRounds,
  generateSeededSlotAssignments,
  generateSymmetricalByes,
  BYE_TEAM,
} from './utils/bracketUtils';
import { X, Tv, ChevronDown, Trophy, Loader2, Dices, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getOrCreateTournament, fetchTournamentData, saveTeam, deleteTeam, deleteAllTeams, saveMatch, saveMatchesBulk, deleteAllMatches, updateTournamentSettings } from './utils/db';

const LOCAL_STORAGE_KEY = 'mahap_tournament_app_state_v1';

const DEFAULT_TEAMS: Team[] = [];

export default function App() {
  const [tournamentTitle, setTournamentTitle] = useState('MAHAP OPEN 2026');
  const [activeTab, setActiveTab] = useState<TabType>('bagan');
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [bracketSize, setBracketSizeState] = useState<number>(8);
  
  const setBracketSize = (size: number) => {
    setBracketSizeState(size);
    const tId = tournamentId || localStorage.getItem('mahap_tournament_id');
    if (tId) updateTournamentSettings(tId, { bracket_size: size });
  };
  const [rounds, setRounds] = useState<Match[][]>(() => createEmptyBracketRounds(8));
  
  // Custom setter that also saves to DB
  const setRoundsWithDb = (updater: any, forceSave: boolean = false) => {
    setRounds((prev) => {
      const nextRounds = typeof updater === 'function' ? updater(prev) : updater;
      if (tournamentId) {
        // Collect matches to save
        const matchesToSave: { rIdx: number; mIdx: number; match: Match }[] = [];
        nextRounds.forEach((round: Match[], rIdx: number) => {
          round.forEach((match: Match, mIdx: number) => {
            const prevMatch = prev[rIdx]?.[mIdx];
            if (forceSave || JSON.stringify(prevMatch) !== JSON.stringify(match)) {
               matchesToSave.push({ rIdx, mIdx, match });
            }
          });
        });

        // Save in bulk
        if (matchesToSave.length > 0) {
          saveMatchesBulk(tournamentId, matchesToSave);
        }
      }
      return nextRounds;
    });
  };
  const [layoutMode, setLayoutModeState] = useState<BracketLayoutMode>('two-sided');
  
  const setLayoutMode = (mode: BracketLayoutMode) => {
    setLayoutModeState(mode);
    const tId = tournamentId || localStorage.getItem('mahap_tournament_id');
    if (tId) updateTournamentSettings(tId, { layout_mode: mode });
  };
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 0.6 : 0.7;
    }
    return 0.7;
  });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isHeaderNavHidden, setIsHeaderNavHidden] = useState<boolean>(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [tournamentPin, setTournamentPin] = useState<string>('123456');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

  // Calculate Optimal Size for Draw Safety Lock
  const validSizes = [4, 8, 16, 32, 64, 128];
  const optimalSize = validSizes.find(v => v >= teams.length) || 128;
  const isDrawLocked = bracketSize !== optimalSize && teams.length > 0;

  // Modal States
  const [isLiveDrawOpen, setIsLiveDrawOpen] = useState(false);
  const [isManualDrawOpen, setIsManualDrawOpen] = useState(false);
  const [isManualDrawHidden, setIsManualDrawHidden] = useState(false);
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const [champion, setChampion] = useState<Team | null>(null);
  const [runnerUp, setRunnerUp] = useState<Team | null>(null);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    isAlert?: boolean;
    isDanger?: boolean;
    confirmText?: string;
    action: () => void;
  }>({
    isOpen: false,
    message: '',
    action: () => {},
  });

  // Load state from Supabase
  const loadTournamentData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const tId = await getOrCreateTournament('MAHAP OPEN 2026', 8, 'two-sided');
      setTournamentId(tId);
      
      const data = await fetchTournamentData(tId);
      if (data.tournament) {
        setTournamentTitle(data.tournament.title);
        setBracketSizeState(data.tournament.bracket_size);
        setLayoutModeState(data.tournament.layout_mode);
        if (data.tournament.pin) {
          setTournamentPin(data.tournament.pin);
        }
        
        // Restore admin state
        const adminTournaments = JSON.parse(localStorage.getItem('admin_tournaments') || '[]');
        if (adminTournaments.includes(tId)) {
          setIsAdmin(true);
        }
      }
      if (data.teams && data.teams.length > 0) {
        setTeams(data.teams.filter((t: any) => t.id !== 'BYE'));
      } else {
        setTeams(DEFAULT_TEAMS);
        // Sync default teams to DB
        if (!silent) {
          for (const t of DEFAULT_TEAMS) {
            await saveTeam(tId, t);
          }
        }
      }
      
      if (data.matches && data.matches.length > 0) {
        // rebuild rounds from flat matches
        const bSize = data.tournament?.bracket_size || 8;
        const builtRounds = createEmptyBracketRounds(bSize);
        
        data.matches.forEach((m: any) => {
          if (builtRounds[m.round_index] && builtRounds[m.round_index][m.match_index]) {
            builtRounds[m.round_index][m.match_index] = {
              ...builtRounds[m.round_index][m.match_index],
              id: m.id,
              t1: m.t1_id ? data.teams.find((t: any) => t.id === m.t1_id) || (m.t1_id === 'BYE' ? BYE_TEAM : null) : null,
              t2: m.t2_id ? data.teams.find((t: any) => t.id === m.t2_id) || (m.t2_id === 'BYE' ? BYE_TEAM : null) : null,
              winner: m.winner_id ? data.teams.find((t: any) => t.id === m.winner_id) || (m.winner_id === 'BYE' ? BYE_TEAM : null) : null,
              loser: m.loser_id ? data.teams.find((t: any) => t.id === m.loser_id) || (m.loser_id === 'BYE' ? BYE_TEAM : null) : null,
              score1: m.score1 || '',
              score2: m.score2 || '',
              schedule: {
                date: m.schedule_date || '',
                court: m.schedule_court || '',
                matchNum: m.schedule_match_num || ''
              }
            };
          }
        });
        setRounds(builtRounds);
      } else {
        // Jika tidak ada data match di DB, tetap buat bagan kosong sesuai bracket_size yang tersimpan
        const bSize = data.tournament?.bracket_size || 8;
        setRounds(createEmptyBracketRounds(bSize));
      }
      
    } catch (error) {
      console.error('Failed to init DB:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load state from Supabase on mount
  useEffect(() => {
    loadTournamentData();
  }, []);

  // Listen to Fullscreen Change Events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPresentationMode(false);
      } else {
        setTimeout(calculateFitToScreen, 300);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Ctrl+Scroll or Presentation scroll for zooming
  useEffect(() => {
    const workspace = document.getElementById('bracket-workspace');
    if (!workspace) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomDirection = e.deltaY > 0 ? -1 : 1;
        const zoomStep = 0.1;
        
        setZoomLevel(prev => {
          let newZoom = prev + (zoomDirection * zoomStep);
          if (newZoom < 0.2) newZoom = 0.2;
          if (newZoom > 2.0) newZoom = 2.0;
          return newZoom;
        });
      }
    };

    workspace.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspace.removeEventListener('wheel', handleWheel);
  }, [isPresentationMode]); // Re-bind if necessary, though it works fine.

  // Check Final match winner for Champion Modal
  useEffect(() => {
    if (rounds.length > 0) {
      const finalRound = rounds[rounds.length - 1];
      if (finalRound && finalRound.length > 0) {
        const finalMatch = finalRound[0];
        if (finalMatch.winner && finalMatch.winner.id !== 'BYE') {
          if (champion?.id !== finalMatch.winner.id) {
            setChampion(finalMatch.winner);
            setRunnerUp(finalMatch.loser || null);
            setIsChampionModalOpen(true);
          }
        } else if (!finalMatch.winner) {
          setChampion(null);
          setRunnerUp(null);
        }
      }
    }
  }, [rounds, champion]);

  // Apply Slot Assignments to Round 0 & Auto Advance BYEs
  const applySlotAssignmentsToRounds = (
    slots: (Team | null)[],
    size: number
  ) => {
    let freshRounds = createEmptyBracketRounds(size);
    
    for (let i = 0; i < size; i++) {
      const matchIdx = Math.floor(i / 2);
      const teamProp = i % 2 === 0 ? 't1' : 't2';
      
      const slot = slots[i];
      if (slot && slot.id === 'BYE') {
        freshRounds[0][matchIdx][teamProp] = BYE_TEAM;
      } else if (slot) {
        freshRounds[0][matchIdx][teamProp] = slot;
      }
    }

    // Check auto advances for byes
    freshRounds[0].forEach((m, idx) => {
      if (m.t1 && m.t1.id === 'BYE' && m.t2 && m.t2.id !== 'BYE') {
        freshRounds = selectWinnerInRounds(freshRounds, 0, idx, 't2');
      } else if (m.t2 && m.t2.id === 'BYE' && m.t1 && m.t1.id !== 'BYE') {
        freshRounds = selectWinnerInRounds(freshRounds, 0, idx, 't1');
      }
    });

    setBracketSize(size);
    setRoundsWithDb(freshRounds, true);
  };

  // Handle Login Admin
  const handleLoginAdmin = () => {
    if (pinInput === tournamentPin) {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setPinInput('');
      if (tournamentId) {
        const adminTournaments = JSON.parse(localStorage.getItem('admin_tournaments') || '[]');
        if (!adminTournaments.includes(tournamentId)) {
          adminTournaments.push(tournamentId);
          localStorage.setItem('admin_tournaments', JSON.stringify(adminTournaments));
        }
      }
    } else {
      alert('PIN yang Anda masukkan salah!');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    if (tournamentId) {
      const adminTournaments = JSON.parse(localStorage.getItem('admin_tournaments') || '[]');
      const filtered = adminTournaments.filter((id: string) => id !== tournamentId);
      localStorage.setItem('admin_tournaments', JSON.stringify(filtered));
    }
  };

  // Participant Management Actions
  const handleAddTeam = (name: string, category: CategoryType, club?: string) => {
    const newTeam: Team = {
      id: 'T' + Date.now(),
      name,
      category,
      club,
    };
    setTeams((prev) => [...prev, newTeam]);
    if (tournamentId) saveTeam(tournamentId, newTeam);
  };

  const handleUpdateTeam = (
    id: string,
    name: string,
    category: CategoryType,
    club?: string
  ) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name, category, club } : t))
    );
    if (tournamentId) saveTeam(tournamentId, { id, name, category, club } as Team);
  };

  const handleDeleteTeam = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Peserta',
      message: 'Apakah Anda yakin ingin menghapus peserta ini?',
      action: () => {
        setTeams((prev) => prev.filter((t) => t.id !== id));
        deleteTeam(id);
      },
    });
  };

  const handleBulkAddTeams = (lines: string[], category: CategoryType) => {
    const newTeams: Team[] = lines.map((line, idx) => ({
      id: 'T' + (Date.now() + idx),
      name: line,
      category,
    }));
    setTeams((prev) => [...prev, ...newTeams]);
    if (tournamentId) {
      newTeams.forEach(t => saveTeam(tournamentId, t));
    }
  };

  const handleClearAllTeams = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Semua Peserta',
      message:
        'Seluruh data peserta akan dihapus. Data bagan pertandingan juga akan dikosongkan.',
      action: async () => {
        setTeams([]);
        if (tournamentId) {
          await deleteAllTeams(tournamentId);
          await deleteAllMatches(tournamentId);
        }
        setRounds(createEmptyBracketRounds(bracketSize));
      },
    });
  };

  // Bracket Toolbar Actions
  const calculateFitToScreen = () => {
    const workspace = document.getElementById('bracket-workspace');
    const container = document.getElementById('bracket-container');

    if (workspace && container) {
      const naturalWidth = container.offsetWidth;
      const availableWidth = workspace.clientWidth;

      if (naturalWidth > 0 && availableWidth > 0) {
        let newZoom = (availableWidth - 40) / naturalWidth;
        if (newZoom > 1.2) newZoom = 1.2;
        if (newZoom < 0.2) newZoom = 0.2;

        setZoomLevel(newZoom);

        setTimeout(() => {
          workspace.scrollLeft = 0;
          workspace.scrollTop = 0;
        }, 50);
      }
    }
  };

  const handleCreateEmptyBracket = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Buat Bagan Baru',
      message: 'Apakah Anda yakin ingin membuat bagan baru? Bagan dan hasil pertandingan sebelumnya akan tertimpa.',
      action: async () => {
        if (tournamentId) {
          await deleteAllMatches(tournamentId);
        }
        setRounds(createEmptyBracketRounds(bracketSize));
        setChampion(null);
        setTimeout(() => calculateFitToScreen(), 50);
      },
    });
  };

  const handleAutoSizeBracket = () => {
    const numTeams = teams.length;
    if (numTeams === 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Tidak Ada Tim',
        message: 'Belum ada tim yang ditambahkan.',
        isAlert: true,
        confirmText: 'Mengerti',
        action: () => {},
      });
      return;
    }
    const validSizes = [4, 8, 16, 32, 64, 128];
    const closestSize = validSizes.find(v => v >= numTeams) || 128;
    const numByes = closestSize - numTeams;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Sesuaikan & Sebar BYE',
      message: `Bagan akan disesuaikan menjadi ${closestSize} slot berdasarkan jumlah tim (${numTeams}). ${numByes > 0 ? `Terdapat ${numByes} slot BYE yang akan disebar secara otomatis. ` : ''}Bagan lama akan tertimpa. Lanjutkan?`,
      confirmText: 'Ya, Sesuaikan',
      action: async () => {
        if (tournamentId) {
          await deleteAllMatches(tournamentId);
        }
        if (numByes > 0) {
          const newSlots = generateSymmetricalByes(closestSize, numByes);
          applySlotAssignmentsToRounds(newSlots, closestSize);
        } else {
          setBracketSize(closestSize);
          setRoundsWithDb(createEmptyBracketRounds(closestSize), true);
        }
        setChampion(null);
        setTimeout(() => calculateFitToScreen(), 50);
      },
    });
  };

  const handleResetBracket = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Bagan',
      message: 'Seluruh struktur bagan akan dikosongkan. Hasil pertandingan dan undian akan dihapus.',
      action: async () => {
        if (tournamentId) {
          await deleteAllMatches(tournamentId);
        }
        setRounds(createEmptyBracketRounds(bracketSize));
        setChampion(null);
        setTimeout(() => calculateFitToScreen(), 50);
      },
    });
  };

  const handleApplyLiveDraw = (
    slotAssignments: (Team | null)[],
    targetSize: number
  ) => {
    applySlotAssignmentsToRounds(slotAssignments, targetSize);
    setActiveTab('bagan');
    setTimeout(() => calculateFitToScreen(), 50);
  };

  const handleForceSaveBracket = async () => {
    if (!tournamentId) return;
    
    // Simpan pengaturan turnamen
    await updateTournamentSettings(tournamentId, { bracket_size: bracketSize, layout_mode: layoutMode });
    
    // Simpan seluruh pertandingan secara serentak (bulk)
    const matchesToSave: { rIdx: number; mIdx: number; match: Match }[] = [];
    rounds.forEach((round, rIdx) => {
      round.forEach((match, mIdx) => {
        matchesToSave.push({ rIdx, mIdx, match });
      });
    });
    
    try {
      await saveMatchesBulk(tournamentId, matchesToSave);
      setConfirmConfig({
        isOpen: true,
        title: 'Berhasil Disimpan',
        message: 'Seluruh struktur bagan dan hasil pertandingan telah berhasil disimpan ke database.',
        isAlert: true,
        confirmText: 'Tutup',
        action: () => {},
      });
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan bagan. Silakan coba lagi.');
    }
  };

  const handleApplySingleDraw = (teamId: string, slotIndex: number) => {
    let updated = rounds.map(r => r.map(m => ({ ...m, schedule: { ...m.schedule } })));
    
    const mIdx = Math.floor(slotIndex / 2);
    const prop = slotIndex % 2 === 0 ? 't1' : 't2';
    const team = teams.find(t => t.id === teamId) || null;
    
    if (updated[0] && updated[0][mIdx]) {
      updated[0][mIdx][prop] = team;
    }

    // Auto advance BYEs
    if (updated.length > 0) {
      for (let m = 0; m < updated[0].length; m++) {
        const match = updated[0][m];
        if (match.t1?.id === 'BYE' && match.t2 && match.t2.id !== 'BYE') {
          updated = selectWinnerInRounds(updated, 0, m, 't2');
        } else if (match.t2?.id === 'BYE' && match.t1 && match.t1.id !== 'BYE') {
          updated = selectWinnerInRounds(updated, 0, m, 't1');
        }
      }
    }
    
    setRoundsWithDb(updated);
    setActiveTab('bagan');
    
    setIsManualDrawHidden(true);
    setHighlightedTeamId(teamId);
    
    // Zoom out slightly to 85% for better overview context
    setZoomLevel(0.85);

    // Beri waktu agar animasi zoom (duration-300) selesai sepenuhnya sebelum mengukur layout
    setTimeout(() => {
       const workspace = document.getElementById('bracket-workspace');
       const highlightedElements = document.querySelectorAll('.highlighted-slot');
       let targetElement: Element | null = null;
       
       // Cari elemen highlight yang benar-benar terlihat di layar (bukan yang tersembunyi karena play-in-hidden)
       for (let i = 0; i < highlightedElements.length; i++) {
           const el = highlightedElements[i];
           const rect = el.getBoundingClientRect();
           if (rect.width > 0 && rect.height > 0) {
               targetElement = el;
               break;
           }
       }
       
       if (workspace && targetElement) {
         const workspaceRect = workspace.getBoundingClientRect();
         const matchRect = targetElement.getBoundingClientRect();
         
         const scrollLeft = workspace.scrollLeft + (matchRect.left - workspaceRect.left) - (workspaceRect.width / 2) + (matchRect.width / 2);
         const scrollTop = workspace.scrollTop + (matchRect.top - workspaceRect.top) - (workspaceRect.height / 2) + (matchRect.height / 2);

         workspace.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
       }
    }, 350);
  };


  const getUndrawnTeamsCount = () => {
    const occupied = new Set<string>();
    if (rounds.length > 0) {
      rounds[0].forEach(m => {
        if (m.t1 && m.t1.id !== 'BYE') occupied.add(m.t1.id);
        if (m.t2 && m.t2.id !== 'BYE') occupied.add(m.t2.id);
      });
    }
    return teams.filter(t => !occupied.has(t.id)).length;
  };

  const handleAutoDistributeByes = () => {
    const numByes = Math.max(0, bracketSize - teams.length);
    if (numByes === 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Tidak Ada BYE',
        message: 'Jumlah tim sudah pas atau melebihi slot bagan. Tidak ada BYE yang perlu disebar.',
        isAlert: true,
        confirmText: 'Mengerti',
        action: () => {},
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Sebar BYE Otomatis',
      message: `Terdapat ${numByes} slot BYE yang akan disebar secara merata pada bagan ${bracketSize} slot. Slot lain akan dikosongkan. Lanjutkan?`,
      confirmText: 'Ya, Sebar',
      action: () => {
        const newSlots = generateSymmetricalByes(bracketSize, numByes);
        applySlotAssignmentsToRounds(newSlots, bracketSize);
      },
    });
  };

  // Match Interactions
  const handleSelectTeamSlot = (
    rIdx: number,
    mIdx: number,
    teamProp: 't1' | 't2',
    teamId: string
  ) => {
    let chosenTeam: Team | null = null;
    if (teamId === 'BYE') {
      chosenTeam = BYE_TEAM;
    } else if (teamId) {
      chosenTeam = teams.find((t) => t.id === teamId) || null;
    }

    setRoundsWithDb((prevRounds) => {
      let updated = prevRounds.map((r) => r.map((m) => ({ ...m, schedule: { ...m.schedule } })));
      const match = updated[rIdx][mIdx];
      match[teamProp] = chosenTeam;

      // Check BYE auto advance
      if (match.t1 && match.t1.id === 'BYE' && match.t2 && match.t2.id !== 'BYE') {
        updated = selectWinnerInRounds(updated, rIdx, mIdx, 't2');
      } else if (match.t2 && match.t2.id === 'BYE' && match.t1 && match.t1.id !== 'BYE') {
        updated = selectWinnerInRounds(updated, rIdx, mIdx, 't1');
      } else {
        updated = undoWinnerInRounds(updated, rIdx, mIdx);
      }

      return updated;
    });
  };

  const handleSelectWinner = (
    rIdx: number,
    mIdx: number,
    teamProp: 't1' | 't2'
  ) => {
    setRoundsWithDb((prev) => selectWinnerInRounds(prev, rIdx, mIdx, teamProp));
  };

  const handleRequestUndoWinner = (
    rIdx: number,
    mIdx: number,
    _teamProp: 't1' | 't2'
  ) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Batalkan Kemenangan',
      message:
        'Batalkan kemenangan tim ini? Pemenang di babak selanjutnya yang bergantung pada hasil ini juga akan dikosongkan.',
      action: () => {
        setRoundsWithDb((prev) => undoWinnerInRounds(prev, rIdx, mIdx));
      },
    });
  };

  const handleUpdateSchedule = (
    rIdx: number,
    mIdx: number,
    field: 'date' | 'court' | 'matchNum',
    val: string
  ) => {
    // Check for conflict
    const targetMatch = rounds[rIdx]?.[mIdx];
    if (targetMatch) {
      const newSchedule = { ...targetMatch.schedule, [field]: val };
      
      // Only check conflict if all three fields are present and not empty
      if (newSchedule.date && newSchedule.court && newSchedule.matchNum) {
        let isConflict = false;
        for (let r = 0; r < rounds.length; r++) {
          for (let m = 0; m < rounds[r].length; m++) {
            if (r === rIdx && m === mIdx) continue;
            
            const otherSchedule = rounds[r][m].schedule;
            if (
              otherSchedule.date === newSchedule.date &&
              otherSchedule.court === newSchedule.court &&
              otherSchedule.matchNum === newSchedule.matchNum
            ) {
              isConflict = true;
              break;
            }
          }
          if (isConflict) break;
        }

        if (isConflict) {
          const [year, month, day] = newSchedule.date.split('-');
          const formattedDate = (year && month && day) ? `${day}-${month}-${year}` : newSchedule.date;

          setConfirmConfig({
            isOpen: true,
            title: 'Jadwal Bentrok!',
            message: `Tanggal ${formattedDate}, Lapangan ${newSchedule.court}, Partai ${newSchedule.matchNum} sudah digunakan di pertandingan lain. Silakan pilih waktu atau lapangan yang berbeda.`,
            isAlert: true,
            confirmText: 'Mengerti',
            action: () => {},
          });
          return; // Abort update
        }
      }
    }

    setRoundsWithDb((prev) =>
      prev.map((round, r) =>
        round.map((match, m) => {
          if (r === rIdx && m === mIdx) {
            return {
              ...match,
              schedule: {
                ...match.schedule,
                [field]: val,
              },
            };
          }
          return match;
        })
      )
    );
  };

  const handleUpdateScore = (
    rIdx: number,
    mIdx: number,
    score1: string,
    score2: string
  ) => {
    setRoundsWithDb((prev) =>
      prev.map((round, r) =>
        round.map((match, m) => {
          if (r === rIdx && m === mIdx) {
            return {
              ...match,
              score1,
              score2,
            };
          }
          return match;
        })
      )
    );
  };

  // Presentation Mode Toggle
  const togglePresentationMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsPresentationMode(true))
        .catch(() => setIsPresentationMode(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsPresentationMode(false);
    }
  };

  // Data Export / Import / Reset
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          { tournamentTitle, teams, bracketSize, rounds, layoutMode },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${tournamentTitle.replace(/\s+/g, '_')}_backup.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.teams) setTeams(parsed.teams);
          if (parsed.bracketSize) {
            const sz = parsed.bracketSize;
            const validSizes = [4, 8, 16, 32, 64, 128];
            const closestSize = validSizes.find(v => v >= sz) || 128;
            setBracketSize(closestSize);
          }
          if (parsed.rounds) setRoundsWithDb(parsed.rounds);
          if (parsed.tournamentTitle) setTournamentTitle(parsed.tournamentTitle);
          if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
        } catch (err) {
          alert('Gagal membaca berkas backup JSON.');
        }
      };
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,No,Nama Tim,Kategori,Klub\n';
    teams.forEach((t, i) => {
      csvContent += `${i + 1},"${t.name}","${t.category}","${t.club || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournamentTitle}_peserta.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleResetAllData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Total Turnamen',
      message:
        'Hapus seluruh data peserta, bagan, dan skor untuk memulai turnamen baru dari awal?',
      action: () => {
        setTeams([]);
        setBracketSize(8);
        setRounds(createEmptyBracketRounds(8));
        setTournamentTitle('MAHAP OPEN 2026');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold">Memuat Data Turnamen...</h2>
      </div>
    );
  }

  return (
    <div
      className={`h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${
        isPresentationMode ? 'p-0 overflow-hidden' : ''
      }`}
    >
      {/* Floating Header & Nav Show Button */}
      {!isPresentationMode && isHeaderNavHidden && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setIsHeaderNavHidden(false)}
            className="px-4 py-1.5 bg-slate-800 border-x border-b border-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-b-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
            title="Tampilkan Header & Navigasi"
          >
            <ChevronDown size={18} className="group-hover:text-blue-400 group-hover:translate-y-0.5 transition-all" />
          </button>
        </div>
      )}

      {/* Header hidden based on user request */}
      
      {/* Navigation */}
      {!isPresentationMode && !isHeaderNavHidden && (
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          teamCount={teams.length}
          onPrint={() => window.print()}
          onOpenLiveDraw={() => setIsLiveDrawOpen(true)}
          onAutoDistributeByes={handleAutoDistributeByes}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onExportCSV={handleExportCSV}
          onResetAllData={handleResetAllData}
          isAdmin={isAdmin}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogoutAdmin}
          isDrawLocked={isDrawLocked}
        />
      )}
      
      {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-h-0 overflow-x-hidden ${activeTab !== 'bagan' && !isPresentationMode ? 'overflow-y-auto' : 'overflow-hidden'} ${isPresentationMode ? 'p-0' : 'p-3 sm:p-6'}`}>
          {activeTab === 'peserta' && !isPresentationMode && (
            <ParticipantManager
              teams={teams}
              isAdmin={isAdmin}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onBulkAddTeams={handleBulkAddTeams}
            onClearAllTeams={handleClearAllTeams}
          />
        )}

        {(activeTab === 'bagan' || isPresentationMode) && (
          <div className={`${isPresentationMode ? 'w-full h-full flex flex-col' : 'max-w-[1600px] w-full h-full mx-auto flex flex-col space-y-4'}`}>
            {isPresentationMode ? (
              <>
                <div className="w-full pt-6 pb-2 z-[100] flex justify-center items-start shrink-0 pointer-events-none">
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/30 shadow-lg rounded-xl px-5 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
                    <Trophy className="text-amber-400 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm uppercase tracking-wide">
                      {tournamentTitle}
                    </h1>
                    <Trophy className="text-amber-400 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </div>
                </div>
                <div className="fixed bottom-6 left-0 w-full z-[10000] flex justify-center items-end pointer-events-none">
                  <div className="w-max max-w-[95%] shadow-2xl shadow-black/80 rounded-xl pointer-events-auto">
                      <BracketToolbar
                        bracketSize={bracketSize}
                        onUpdateBracketSize={setBracketSize}
                        onCreateEmptyBracket={handleCreateEmptyBracket}
                        layoutMode={layoutMode}
                        onChangeLayoutMode={setLayoutMode}
                        zoomLevel={zoomLevel}
                        onChangeZoom={(delta) =>
                          setZoomLevel((prev) => Math.min(2.0, Math.max(0.3, prev + delta)))
                        }
                          onFitToScreen={() => calculateFitToScreen()}
                          onResetZoom={() => {
                            const isMobile = window.innerWidth < 640;
                            setZoomLevel(isMobile ? 0.6 : 0.7);
                          }}
                          totalRounds={rounds.length}
                          onRefresh={() => loadTournamentData(true)}
                          activeFilter={activeFilter}
                        onChangeFilter={setActiveFilter}
                        onOpenManualDraw={isAdmin ? () => setIsManualDrawOpen(true) : undefined}
                        onRequestResetBracket={isAdmin ? handleResetBracket : undefined}
                        isPresentationMode={isPresentationMode}
                        onTogglePresentation={togglePresentationMode}
                        onAutoSizeBracket={isAdmin ? handleAutoSizeBracket : undefined}
                        onSaveBracket={isAdmin ? handleForceSaveBracket : undefined}
                        activeTab={activeTab}
                        onChangeTab={(tab) => setActiveTab(tab)}
                        isAdmin={isAdmin}
                        isDrawLocked={isDrawLocked}
                      />
                </div>
              </div>
              </>
            ) : (
              <BracketToolbar
                bracketSize={bracketSize}
                onUpdateBracketSize={setBracketSize}
                onCreateEmptyBracket={handleCreateEmptyBracket}
                layoutMode={layoutMode}
                onChangeLayoutMode={setLayoutMode}
                zoomLevel={zoomLevel}
                onChangeZoom={(delta) =>
                  setZoomLevel((prev) => Math.min(2.0, Math.max(0.3, prev + delta)))
                }
                  onFitToScreen={() => calculateFitToScreen()}
                  onResetZoom={() => {
                    const isMobile = window.innerWidth < 640;
                    setZoomLevel(isMobile ? 0.6 : 0.7);
                  }}
                  totalRounds={rounds.length}
                  onRefresh={() => loadTournamentData(true)}
                  activeFilter={activeFilter}
                onChangeFilter={setActiveFilter}
                onOpenManualDraw={isAdmin ? () => setIsManualDrawOpen(true) : undefined}
                onRequestResetBracket={isAdmin ? handleResetBracket : undefined}
                isPresentationMode={isPresentationMode}
                onTogglePresentation={togglePresentationMode}
                onAutoSizeBracket={isAdmin ? handleAutoSizeBracket : undefined}
                onSaveBracket={isAdmin ? handleForceSaveBracket : undefined}
                activeTab={activeTab}
                onChangeTab={(tab) => setActiveTab(tab)}
                isAdmin={isAdmin}
              />
            )}

            <div className={`flex-1 min-h-0 relative ${isPresentationMode ? 'bg-slate-950 flex flex-col' : 'bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden'}`}>
                {activeTab === 'bagan' && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <img src="/logo.png" alt="PB Batu Betulis Watermark" className="w-[600px] h-[600px] object-contain opacity-[0.15]" />
                    </div>
                    <BracketCanvas
                      rounds={rounds}
                      teams={teams}
                      layoutMode={layoutMode}
                      zoomLevel={zoomLevel}
                      activeFilter={activeFilter}
                      onSelectTeamSlot={isAdmin ? handleSelectTeamSlot : undefined}
                      onSelectWinner={isAdmin ? handleSelectWinner : undefined}
                      onRequestUndoWinner={isAdmin ? handleRequestUndoWinner : undefined}
                      onUpdateSchedule={isAdmin ? handleUpdateSchedule : undefined}
                      isPresentationMode={isPresentationMode}
                      highlightedTeamId={highlightedTeamId}
                      isAdmin={isAdmin}
                    />
                  </>
                )}
                {activeTab === 'jadwal' && isPresentationMode && (
                  <div className="absolute inset-0 overflow-y-auto px-4 md:px-12 pt-6 pb-20 bg-white print-schedule-container">
                    <ScheduleView
                      rounds={rounds}
                      teams={teams}
                      onUpdateScore={isAdmin ? handleUpdateScore : undefined}
                      onUpdateSchedule={isAdmin ? handleUpdateSchedule : undefined}
                      onRefresh={() => loadTournamentData(true)}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'jadwal' && !isPresentationMode && (
          <ScheduleView
            rounds={rounds}
            teams={teams}
            onUpdateScore={isAdmin ? handleUpdateScore : undefined}
            onUpdateSchedule={isAdmin ? handleUpdateSchedule : undefined}
            onRefresh={() => loadTournamentData(true)}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Login Admin Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-700/80 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Login Admin
              </h2>
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setPinInput('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-300 text-sm mb-4">
                Masukkan PIN Turnamen untuk membuka fitur edit (Mengacak bagan, mengatur skor, dll).
              </p>
              
              <div className="mb-6">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoginAdmin();
                  }}
                  placeholder="Masukkan PIN (Default: 123456)"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-xl tracking-widest font-mono"
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleLoginAdmin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5"
              >
                MASUK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Continue Draw Button */}
      {isManualDrawOpen && isManualDrawHidden && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-2 animate-bounce">
          <button
            onClick={() => {
              setIsManualDrawHidden(false);
              setHighlightedTeamId(null);
              // Kembalikan ukuran bagan (fit to screen) saat lanjut undi
              setTimeout(() => calculateFitToScreen(), 50);
              
              if (getUndrawnTeamsCount() === 0) {
                 setIsManualDrawOpen(false);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/50 border border-blue-400 font-bold text-sm transition-transform hover:scale-105"
          >
            <Dices size={18} />
            {getUndrawnTeamsCount() > 0 ? "Undi Tim Berikutnya" : "Selesai Pengundian"}
          </button>
          
          <button
            onClick={() => {
              setIsManualDrawOpen(false);
              setIsManualDrawHidden(false);
              setHighlightedTeamId(null);
            }}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-full shadow-xl border border-slate-600 hover:border-red-500 transition-colors"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      <LiveDrawModal
        isOpen={isLiveDrawOpen}
        teams={teams}
        bracketSize={bracketSize}
        onClose={() => setIsLiveDrawOpen(false)}
        onApplyDraw={handleApplyLiveDraw}
      />
      <ManualDrawModal
        isOpen={isManualDrawOpen}
        onClose={() => {
          setIsManualDrawOpen(false);
          setIsManualDrawHidden(false);
          setHighlightedTeamId(null);
        }}
        teams={teams}
        bracketSize={bracketSize}
        rounds={rounds}
        layoutMode={layoutMode}
        isHidden={isManualDrawHidden}
        onApplySingleDraw={handleApplySingleDraw}
      />


      <ChampionModal
        isOpen={isChampionModalOpen}
        champion={champion}
        runnerUp={runnerUp}
        onClose={() => setIsChampionModalOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isAlert={confirmConfig.isAlert}
        isDanger={confirmConfig.isDanger}
        confirmText={confirmConfig.confirmText}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig({ isOpen: false, message: '', action: () => {} });
        }}
        onCancel={() =>
          setConfirmConfig({ isOpen: false, message: '', action: () => {} })
        }
      />
    </div>
  );
}
