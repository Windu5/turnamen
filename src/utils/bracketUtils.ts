import { Team, Match, CategoryType } from '../types';

export function getNextPowerOf2(n: number): number {
  if (n <= 2) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function getRoundName(roundIdx: number, totalRounds: number): string {
  const reverseIdx = totalRounds - roundIdx - 1;
  if (reverseIdx === 0) return 'Final';
  if (reverseIdx === 1) return 'Semi Final';
  if (reverseIdx === 2) return 'Perempat Final';
  if (reverseIdx === 3) return 'Babak 16 Besar';
  if (reverseIdx === 4) return 'Babak 32 Besar';
  if (reverseIdx === 5) return 'Babak 64 Besar';
  return `Babak ${Math.pow(2, reverseIdx + 1)} Besar`;
}

export function createEmptyBracketRounds(bracketSize: number): Match[][] {
  const numRounds = Math.log2(bracketSize);
  const rounds: Match[][] = [];

  for (let r = 0; r < numRounds; r++) {
    const roundMatches: Match[] = [];
    const numMatches = bracketSize / Math.pow(2, r + 1);

    for (let m = 0; m < numMatches; m++) {
      roundMatches.push({
        id: `r${r}-m${m}`,
        t1: null,
        t2: null,
        winner: null,
        loser: null,
        score1: '',
        score2: '',
        schedule: { date: '', court: '', matchNum: '' },
      });
    }
    rounds.push(roundMatches);
  }

  return rounds;
}

export function selectWinnerInRounds(
  rounds: Match[][],
  rIdx: number,
  mIdx: number,
  teamProp: 't1' | 't2'
): Match[][] {
  // Deep clone or fresh map to preserve immutability
  const newRounds = rounds.map((r) =>
    r.map((m) => ({
      ...m,
      schedule: { ...m.schedule },
    }))
  );

  const match = newRounds[rIdx][mIdx];
  const winner = match[teamProp];
  if (!winner || winner.id === 'BYE') return newRounds;

  match.winner = winner;
  match.loser = teamProp === 't1' ? match.t2 : match.t1;
  const totalRounds = newRounds.length;

  if (rIdx < totalRounds - 1) {
    const nextMatchIdx = Math.floor(mIdx / 2);
    const nextTeamProp = mIdx % 2 === 0 ? 't1' : 't2';
    const nextMatch = newRounds[rIdx + 1][nextMatchIdx];

    nextMatch[nextTeamProp] = winner;

    const otherTeamInNext = nextTeamProp === 't1' ? nextMatch.t2 : nextMatch.t1;
    if (otherTeamInNext && otherTeamInNext.id === 'BYE') {
      nextMatch.winner = winner;
      if (rIdx + 1 < totalRounds - 1) {
        const nnMatchIdx = Math.floor(nextMatchIdx / 2);
        const nnTeamProp = nextMatchIdx % 2 === 0 ? 't1' : 't2';
        newRounds[rIdx + 2][nnMatchIdx][nnTeamProp] = winner;
      }
    }
  }

  return newRounds;
}

export function undoWinnerInRounds(
  rounds: Match[][],
  rIdx: number,
  mIdx: number
): Match[][] {
  const newRounds = rounds.map((r) =>
    r.map((m) => ({
      ...m,
      schedule: { ...m.schedule },
    }))
  );

  const totalRounds = newRounds.length;

  function clearUpwards(currRIdx: number, currMIdx: number) {
    if (currRIdx >= totalRounds - 1) return;
    const nextRIdx = currRIdx + 1;
    const nextMIdx = Math.floor(currMIdx / 2);
    const nextProp = currMIdx % 2 === 0 ? 't1' : 't2';
    const nextMatch = newRounds[nextRIdx][nextMIdx];

    if (
      nextMatch.winner &&
      nextMatch[nextProp] &&
      nextMatch.winner.id === nextMatch[nextProp]!.id
    ) {
      clearUpwards(nextRIdx, nextMIdx);
      nextMatch.winner = null;
      nextMatch.loser = null;
    }

    nextMatch[nextProp] = null;
    if (nextMatch.t1 && nextMatch.t1.id === 'BYE') nextMatch.winner = null;
    if (nextMatch.t2 && nextMatch.t2.id === 'BYE') nextMatch.winner = null;
  }

  clearUpwards(rIdx, mIdx);
  const match = newRounds[rIdx][mIdx];
  match.winner = null;
  match.loser = null;

  return newRounds;
}

export const BYE_TEAM: Team = {
  id: 'BYE',
  name: 'BYE',
  category: 'Non-Seeded',
};

/**
 * Smart Seeding Distribution:
 * Places Seeded A at opposite extremes (e.g. slot 1, slot N),
 * Seeded B at middle quarter points,
 * then fills remaining slots with Non-Seeded teams and BYE placeholders.
 */
export function generateSeededSlotAssignments(
  teams: Team[],
  bracketSize: number
): (Team | null)[] {
  const slots: (Team | null)[] = new Array(bracketSize).fill(null);

  const seededA = teams.filter((t) => t.category === 'Seeded A');
  const seededB = teams.filter((t) => t.category === 'Seeded B');
  const nonSeeded = teams.filter((t) => t.category === 'Non-Seeded');

  // Shuffle within groups for randomness
  const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

  const shufA = shuffle(seededA);
  const shufB = shuffle(seededB);
  const shufNon = shuffle(nonSeeded);

  // Priority positions for seeds to avoid early matchups
  // For size 8: [0, 7, 3, 4, 1, 6, 2, 5]
  // For size 16: [0, 15, 7, 8, 3, 12, 4, 11...]
  const seedPositions: number[] = [];
  if (bracketSize >= 2) seedPositions.push(0, bracketSize - 1);
  if (bracketSize >= 4) seedPositions.push(Math.floor(bracketSize / 2) - 1, Math.floor(bracketSize / 2));
  if (bracketSize >= 8) {
    const q1 = Math.floor(bracketSize / 4);
    const q3 = Math.floor((3 * bracketSize) / 4);
    seedPositions.push(q1 - 1, q1, q3 - 1, q3);
  }
  // Fill remaining index sequence
  for (let i = 0; i < bracketSize; i++) {
    if (!seedPositions.includes(i)) {
      seedPositions.push(i);
    }
  }

  let posIdx = 0;

  // Place Seeded A
  for (const team of shufA) {
    if (posIdx < seedPositions.length) {
      slots[seedPositions[posIdx]] = team;
      posIdx++;
    }
  }

  // Place Seeded B
  for (const team of shufB) {
    if (posIdx < seedPositions.length) {
      slots[seedPositions[posIdx]] = team;
      posIdx++;
    }
  }

  // Determine how many BYEs are needed
  const totalRealTeams = teams.length;
  const numByes = Math.max(0, bracketSize - totalRealTeams);

  // Remaining open slot indices
  const openIndices: number[] = [];
  for (let i = 0; i < bracketSize; i++) {
    if (slots[i] === null) {
      openIndices.push(i);
    }
  }

  const shufOpenIndices = shuffle(openIndices);

  // Fill Non-seeded
  let nonIdx = 0;
  for (let i = 0; i < shufOpenIndices.length; i++) {
    const slotIdx = shufOpenIndices[i];
    if (nonIdx < shufNon.length) {
      slots[slotIdx] = shufNon[nonIdx];
      nonIdx++;
    } else if (i < shufOpenIndices.length) {
      slots[slotIdx] = BYE_TEAM;
    }
  }

  return slots;
}

/**
 * Automatically distribute BYEs symmetrically for manual filling.
 */
export function generateSymmetricalByes(
  bracketSize: number,
  numByes: number
): (Team | null)[] {
  const slots: (Team | null)[] = new Array(bracketSize).fill(null);
  
  // Use a standard tournament seeding algorithm to distribute BYEs evenly
  let order = [0, 1];
  let currentSize = 2;
  
  while (currentSize < bracketSize) {
    const nextOrder: number[] = [];
    for (let i = 0; i < order.length; i++) {
      const val = order[i];
      nextOrder.push(val);
      nextOrder.push(currentSize * 2 - 1 - val);
    }
    order = nextOrder;
    currentSize *= 2;
  }

  // Fallback if bracketSize is not a power of 2 (shouldn't happen in standard brackets, but just in case)
  const seedPositions = order.length === bracketSize ? order : [];
  
  // Fill any missing indices just in case bracketSize is odd or not power of 2
  for (let i = 0; i < bracketSize; i++) {
    if (!seedPositions.includes(i)) {
      seedPositions.push(i);
    }
  }

  // Place BYEs
  for (let i = 0; i < numByes; i++) {
    if (i < seedPositions.length) {
      slots[seedPositions[i]] = BYE_TEAM;
    }
  }

  return slots;
}

