import { supabase } from './supabaseClient';
import { Team, Match, BracketLayoutMode } from '../types';

// Helper function to get the current tournament ID from localStorage
// Or create a new one if it doesn't exist.
export const getOrCreateTournament = async (
  title: string,
  bracketSize: number,
  layoutMode: BracketLayoutMode
): Promise<string> => {
  let tournamentId = localStorage.getItem('mahap_tournament_id');

  if (tournamentId) {
    // Verify if it exists in DB
    const { data } = await supabase
      .from('tournaments')
      .select('id')
      .eq('id', tournamentId)
      .limit(1);

    if (data && data.length > 0) return tournamentId;
  }

  // Create new tournament
  const { data, error } = await supabase
    .from('tournaments')
    .insert([{ title, bracket_size: bracketSize, layout_mode: layoutMode }])
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating tournament:', error);
    throw new Error('Gagal membuat turnamen');
  }

  // Ensure BYE team exists in this tournament to satisfy foreign key constraints
  await supabase.from('teams').insert([{
    id: 'BYE',
    tournament_id: data.id,
    name: 'BYE',
    category: 'Non-Seeded',
    club: ''
  }]);

  localStorage.setItem('mahap_tournament_id', data.id);
  return data.id;
};

export const fetchTournamentData = async (tournamentId: string) => {
  // Ensure BYE_TEAM exists in this tournament before fetching
  const { data: existingBye } = await supabase
    .from('teams')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('id', 'BYE')
    .maybeSingle();

  if (!existingBye) {
    await supabase.from('teams').insert([{
      id: 'BYE',
      tournament_id: tournamentId,
      name: 'BYE',
      category: 'Non-Seeded',
      club: ''
    }]);
  }

  const [tRes, teamsRes, matchesRes] = await Promise.all([
    supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
    supabase.from('teams').select('*').eq('tournament_id', tournamentId),
    supabase.from('matches').select('*').eq('tournament_id', tournamentId)
  ]);

  if (tRes.error) {
    console.error('Error fetching tournament:', tRes.error);
    throw new Error('Gagal mengambil data turnamen');
  }

  return {
    tournament: tRes.data,
    teams: teamsRes.data || [],
    matches: matchesRes.data || []
  };
};

export const updateTournamentSettings = async (
  tournamentId: string,
  settings: { title?: string; bracket_size?: number; layout_mode?: BracketLayoutMode }
) => {
  const { error } = await supabase
    .from('tournaments')
    .update(settings)
    .eq('id', tournamentId);
  
  if (error) {
    console.error('Error updating tournament settings:', error);
  }
};

export const saveTeam = async (tournamentId: string, team: Team) => {
  const { error } = await supabase.from('teams').upsert({
    id: team.id,
    tournament_id: tournamentId,
    name: team.name,
    category: team.category,
    club: team.club
  }, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving team:', error);
    alert('Gagal menyimpan tim ke database: ' + error.message);
  }
};

export const deleteTeam = async (teamId: string) => {
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) {
    console.error('Error deleting team:', error);
    alert('Gagal menghapus tim dari database: ' + error.message);
  }
};

export const deleteAllTeams = async (tournamentId: string) => {
  const { error } = await supabase.from('teams')
    .delete()
    .eq('tournament_id', tournamentId)
    .neq('id', 'BYE');
  if (error) {
    console.error('Error clearing teams:', error);
    alert('Gagal menghapus semua peserta: ' + error.message);
  }
};

export const deleteAllMatches = async (tournamentId: string) => {
  const { error } = await supabase.from('matches').delete().eq('tournament_id', tournamentId);
  if (error) {
    console.error('Error clearing matches:', error);
    alert('Gagal mereset bagan: ' + error.message);
  }
};

let saveQueue: Promise<void> = Promise.resolve();

export const saveMatch = async (
  tournamentId: string,
  roundIndex: number,
  matchIndex: number,
  match: Match
) => {
  return new Promise<void>((resolve) => {
    saveQueue = saveQueue.then(async () => {
      const matchData = {
        tournament_id: tournamentId,
        round_index: roundIndex,
        match_index: matchIndex,
        t1_id: match.t1?.id ?? null,
        t2_id: match.t2?.id ?? null,
        winner_id: match.winner?.id ?? null,
        loser_id: match.loser?.id ?? null,
        score1: match.score1 !== undefined && match.score1 !== '' ? match.score1 : null,
        score2: match.score2 !== undefined && match.score2 !== '' ? match.score2 : null,
        schedule_date: match.schedule.date || null,
        schedule_court: match.schedule.court || null,
        schedule_match_num: match.schedule.matchNum || null
      };

      try {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('round_index', roundIndex)
          .eq('match_index', matchIndex)
          .maybeSingle();

        if (existingMatch) {
          const { error } = await supabase
            .from('matches')
            .update(matchData)
            .eq('id', existingMatch.id);
          if (error) console.error('Error updating match:', error);
        } else {
          const { error } = await supabase
            .from('matches')
            .insert([matchData]);
          if (error) console.error('Error inserting match:', error);
        }
      } catch (err) {
        console.error('Save match exception:', err);
      }
      resolve();
    }).catch((err) => {
      console.error('Queue error:', err);
      resolve();
    });
  });
};

export const saveMatchesBulk = async (
  tournamentId: string,
  matchesToSave: { rIdx: number; mIdx: number; match: Match }[]
) => {
  if (matchesToSave.length === 0) return;

  return new Promise<void>((resolve) => {
    saveQueue = saveQueue.then(async () => {
      try {
        const { data: existingMatches } = await supabase
          .from('matches')
          .select('id, round_index, match_index')
          .eq('tournament_id', tournamentId);

        const matchIdMap = new Map<string, string>();
        if (existingMatches) {
          existingMatches.forEach(m => {
            matchIdMap.set(`${m.round_index}-${m.match_index}`, m.id);
          });
        }

        const payload = matchesToSave.map(({ rIdx, mIdx, match }) => {
          const existingId = matchIdMap.get(`${rIdx}-${mIdx}`);
          const data: any = {
            tournament_id: tournamentId,
            round_index: rIdx,
            match_index: mIdx,
            t1_id: match.t1?.id ?? null,
            t2_id: match.t2?.id ?? null,
            winner_id: match.winner?.id ?? null,
            loser_id: match.loser?.id ?? null,
            score1: match.score1 !== undefined && match.score1 !== '' ? match.score1 : null,
            score2: match.score2 !== undefined && match.score2 !== '' ? match.score2 : null,
            schedule_date: match.schedule.date || null,
            schedule_court: match.schedule.court || null,
            schedule_match_num: match.schedule.matchNum || null
          };
          if (existingId) {
            data.id = existingId;
          }
          return data;
        });

        const { error } = await supabase
          .from('matches')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          console.error('Error bulk upserting matches:', error);
        }
      } catch (err) {
        console.error('Save matches bulk exception:', err);
      }
      resolve();
    }).catch((err) => {
      console.error('Queue error:', err);
      resolve();
    });
  });
};
