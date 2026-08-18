export type CategoryType = 'Non-Seeded' | 'Seeded A' | 'Seeded B';

export interface Team {
  id: string;
  name: string;
  category: CategoryType;
  club?: string;
}

export interface MatchSchedule {
  date: string;
  court: string;
  matchNum: string;
}

export interface Match {
  id: string;
  t1: Team | null;
  t2: Team | null;
  winner: Team | null;
  loser: Team | null;
  score1?: string;
  score2?: string;
  schedule: MatchSchedule;
}

export interface Round {
  roundIndex: number;
  name: string;
  matches: Match[];
}

export type BracketLayoutMode = 'two-sided' | 'one-sided';

export interface BracketData {
  size: number;
  rounds: Match[][];
  layoutMode: BracketLayoutMode;
}

export interface TournamentConfig {
  title: string;
  subtitle: string;
  courtsList: string[];
}
