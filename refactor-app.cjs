const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add imports
content = content.replace(
  "import { X, Tv, ChevronDown, Trophy } from 'lucide-react';",
  "import { X, Tv, ChevronDown, Trophy, Loader2 } from 'lucide-react';\nimport { getOrCreateTournament, fetchTournamentData, saveTeam, deleteTeam, saveMatch } from './utils/db';"
);

// 2. Add tournamentId state
content = content.replace(
  "const [isHeaderNavHidden, setIsHeaderNavHidden] = useState<boolean>(false);",
  "const [isHeaderNavHidden, setIsHeaderNavHidden] = useState<boolean>(false);\n  const [tournamentId, setTournamentId] = useState<string | null>(null);\n  const [isLoading, setIsLoading] = useState<boolean>(true);"
);

// 3. Replace useEffects for mount and save
const useEffectTarget = `  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.tournamentTitle) setTournamentTitle(data.tournamentTitle);
        if (data.teams) setTeams(data.teams);
        if (data.bracketSize) {
          const sz = data.bracketSize;
          const validSizes = [4, 8, 16, 32, 64, 128];
          const closestSize = validSizes.find(v => v >= sz) || 128;
          setBracketSize(closestSize);
        }
        if (data.rounds) setRounds(data.rounds);
        if (data.layoutMode) setLayoutMode(data.layoutMode);
      } else {
        // Initial auto-draw for first load
        const initialSlots = generateSeededSlotAssignments(DEFAULT_TEAMS, 8);
        applySlotAssignmentsToRounds(initialSlots, 8);
      }
    } catch (e) {
      console.error('Failed to parse saved tournament state:', e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        tournamentTitle,
        teams,
        bracketSize,
        rounds,
        layoutMode,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save tournament state:', e);
    }
  }, [tournamentTitle, teams, bracketSize, rounds, layoutMode]);`;

const useEffectReplacement = `  // Load state from Supabase on mount
  useEffect(() => {
    const initDb = async () => {
      setIsLoading(true);
      try {
        const tId = await getOrCreateTournament('MAHAP OPEN 2026', 8, 'two-sided');
        setTournamentId(tId);
        
        const data = await fetchTournamentData(tId);
        if (data.tournament) {
          setTournamentTitle(data.tournament.title);
          setBracketSize(data.tournament.bracket_size);
          setLayoutMode(data.tournament.layout_mode);
        }
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams);
        } else {
          setTeams(DEFAULT_TEAMS);
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
          // Initial auto-draw for first load
          const initialSlots = generateSeededSlotAssignments(DEFAULT_TEAMS, 8);
          applySlotAssignmentsToRounds(initialSlots, 8);
        }
      } catch (error) {
        console.error('Failed to init DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initDb();
  }, []);`;

content = content.replace(useEffectTarget, useEffectReplacement);

// 4. Update save helpers
// Instead of patching every function individually, we will patch them safely.
content = content.replace(
  "setTeams((prev) => [...prev, newTeam]);",
  "setTeams((prev) => [...prev, newTeam]);\n    if (tournamentId) saveTeam(tournamentId, newTeam);"
);

content = content.replace(
  "setTeams((prev) =>\n      prev.map((t) => (t.id === id ? { ...t, name, category, club } : t))\n    );",
  "setTeams((prev) =>\n      prev.map((t) => (t.id === id ? { ...t, name, category, club } : t))\n    );\n    if (tournamentId) saveTeam(tournamentId, { id, name, category, club } as Team);"
);

content = content.replace(
  "setTeams((prev) => prev.filter((t) => t.id !== id));",
  "setTeams((prev) => prev.filter((t) => t.id !== id));\n        deleteTeam(id);"
);

content = content.replace(
  "setTeams((prev) => [...prev, ...newTeams]);",
  "setTeams((prev) => [...prev, ...newTeams]);\n    if (tournamentId) {\n      newTeams.forEach(t => saveTeam(tournamentId, t));\n    }"
);

// We need a helper to sync matches after `setRounds` is called, because many functions update `setRounds`.
// Let's add an effect that watches `rounds` and saves changed matches.
// Actually, tracking which match changed in an effect is hard without prev state.
// We can just add a global saveMatch hook inside the state updater if we rewrite the state updaters.
// For now, let's just make the sync easier:
// We can add a function to save the whole bracket, but that's slow.
// Let's patch `setRounds` directly.
content = content.replace(
  "const [rounds, setRounds] = useState<Match[][]>(() => createEmptyBracketRounds(8));",
  `const [rounds, setRounds] = useState<Match[][]>(() => createEmptyBracketRounds(8));
  
  // Custom setter that also saves to DB
  const setRoundsWithDb = (updater: any) => {
    setRounds((prev) => {
      const nextRounds = typeof updater === 'function' ? updater(prev) : updater;
      if (tournamentId) {
        // Find changed matches to save
        nextRounds.forEach((round: Match[], rIdx: number) => {
          round.forEach((match: Match, mIdx: number) => {
            const prevMatch = prev[rIdx]?.[mIdx];
            if (JSON.stringify(prevMatch) !== JSON.stringify(match)) {
               saveMatch(tournamentId, rIdx, mIdx, match);
            }
          });
        });
      }
      return nextRounds;
    });
  };`
);

// Now replace all `setRounds` with `setRoundsWithDb` EXCEPT the state initialization
content = content.replace(/setRounds\(/g, "setRoundsWithDb(");
// Fix the state initialization that we accidentally replaced
content = content.replace("const [rounds, setRoundsWithDb] = useState", "const [rounds, setRounds] = useState");
// Fix the one inside initDb where tournamentId is not yet in state scope
content = content.replace("setRoundsWithDb(builtRounds);", "setRounds(builtRounds);");
content = content.replace("setRoundsWithDb(createEmptyBracketRounds(8));", "setRounds(createEmptyBracketRounds(8));");

// Add loading state UI
content = content.replace(
  "return (",
  `if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold">Memuat Data Turnamen...</h2>
      </div>
    );
  }

  return (`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.tsx refactored successfully.');
