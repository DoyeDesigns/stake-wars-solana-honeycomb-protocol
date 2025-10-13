import { BracketMatch, BracketRound, TournamentParticipant, TournamentSize } from "@/types/tournament";

/**
 * Shuffle array using Fisher-Yates algorithm for random seeding
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get the round name based on match count
 * For 2-player tournaments: 1 match = finals
 * For 4-player tournaments: 2 matches = semifinals, 1 match = finals, 1 match = third_place
 */
function getRoundName(matchCount: number): BracketRound {
  if (matchCount === 1) return 'finals';
  if (matchCount === 2) return 'semifinals';
  if (matchCount === 4) return 'quarterfinals';
  if (matchCount === 8) return 'round_of_16';
  return 'round_of_32';
}

/**
 * Special round identifier for 3rd place match
 */
export const THIRD_PLACE_MATCH_ID = 'third_place_match';

/**
 * Generate tournament bracket for single elimination
 * Supports 2, 4, 8, 16, and 32 player tournaments
 */
export function generateBracket(
  participants: TournamentParticipant[],
  tournamentSize: TournamentSize
): BracketMatch[] {
  // Validate participant count matches tournament size
  if (participants.length !== tournamentSize) {
    console.warn(`Warning: ${participants.length} participants for a ${tournamentSize}-player tournament`);
  }

  // Shuffle participants for random seeding
  const shuffledParticipants = shuffleArray(participants);
  
  // Assign seed positions
  shuffledParticipants.forEach((p, index) => {
    p.seedPosition = index + 1;
  });

  const bracket: BracketMatch[] = [];
  const firstRoundMatchCount = tournamentSize / 2;

  // Generate first round matches
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const player1 = shuffledParticipants[i * 2];
    const player2 = shuffledParticipants[i * 2 + 1];

    bracket.push({
      matchId: `round1_match${i + 1}`,
      round: getRoundName(firstRoundMatchCount),
      position: i + 1,
      player1,
      player2,
    });
  }

  // Generate placeholder matches for subsequent rounds
  let currentRoundMatches = firstRoundMatchCount / 2;
  let roundNumber = 2;

  while (currentRoundMatches >= 1) {
    for (let i = 0; i < currentRoundMatches; i++) {
      bracket.push({
        matchId: `round${roundNumber}_match${i + 1}`,
        round: getRoundName(currentRoundMatches),
        position: i + 1,
      });
    }
    currentRoundMatches = currentRoundMatches / 2;
    roundNumber++;
  }

  // Add a 3rd place match placeholder for all tournaments
  // This will be populated with semifinal losers if numberOfWinners = 4
  // Always add it to the bracket, but only use it when needed
  bracket.push({
    matchId: THIRD_PLACE_MATCH_ID,
    round: 'third_place' as BracketRound,
    position: 0, // Special position for 3rd place match
  });

  return bracket;
}

/**
 * Get matches for a specific round
 */
export function getMatchesByRound(bracket: BracketMatch[], round: BracketRound): BracketMatch[] {
  return bracket.filter(match => match.round === round);
}

/**
 * Get all active (playable) matches - matches where both players are assigned
 */
export function getActiveMatches(bracket: BracketMatch[]): BracketMatch[] {
  return bracket.filter(match => 
    match.player1 && 
    match.player2 && 
    !match.winner &&
    !match.completedAt
  );
}

/**
 * Progress winner to next match
 */
export function progressWinner(
  bracket: BracketMatch[],
  completedMatchId: string,
  winnerAddress: string
): BracketMatch[] {
  const updatedBracket = [...bracket];
  const completedMatchIndex = updatedBracket.findIndex(m => m.matchId === completedMatchId);
  
  if (completedMatchIndex === -1) {
    throw new Error("Match not found");
  }

  const completedMatch = updatedBracket[completedMatchIndex];
  
  // Find winner participant details
  const winner = completedMatch.player1?.address === winnerAddress 
    ? completedMatch.player1 
    : completedMatch.player2;

  if (!winner) {
    throw new Error("Winner not found in match");
  }

  // Update completed match
  updatedBracket[completedMatchIndex] = {
    ...completedMatch,
    winner: winnerAddress,
    completedAt: Date.now(),
  };

  // If this is the finals or 3rd place match, we're done (no progression)
  if (completedMatch.round === 'finals' || completedMatch.round === 'third_place') {
    return updatedBracket;
  }

  // Find next match based on position
  const nextRound = getNextRound(completedMatch.round);
  const nextMatchPosition = Math.ceil(completedMatch.position / 2);

  const nextMatchIndex = updatedBracket.findIndex(
    m => m.round === nextRound && m.position === nextMatchPosition
  );

  if (nextMatchIndex === -1) {
    throw new Error("Next match not found");
  }

  const nextMatch = updatedBracket[nextMatchIndex];
  
  // Assign winner to next match (odd positions go to player1, even to player2)
  if (completedMatch.position % 2 === 1) {
    updatedBracket[nextMatchIndex] = {
      ...nextMatch,
      player1: winner,
    };
  } else {
    updatedBracket[nextMatchIndex] = {
      ...nextMatch,
      player2: winner,
    };
  }

  return updatedBracket;
}

/**
 * Get next round
 */
function getNextRound(currentRound: BracketRound): BracketRound {
  switch (currentRound) {
    case 'round_of_32': return 'round_of_16';
    case 'round_of_16': return 'quarterfinals';
    case 'quarterfinals': return 'semifinals';
    case 'semifinals': return 'finals';
    case 'finals': return 'finals'; // No next round
    case 'third_place': return 'third_place'; // 3rd place match doesn't progress
    default: return 'finals';
  }
}

/**
 * Check if tournament is complete
 */
export function isTournamentComplete(bracket: BracketMatch[]): boolean {
  const finalsMatch = bracket.find(m => m.round === 'finals');
  if (!finalsMatch || !finalsMatch.winner) return false;
  
  // Check if there's a 3rd place match that needs to be completed
  const thirdPlaceMatch = bracket.find(m => m.matchId === THIRD_PLACE_MATCH_ID);
  if (thirdPlaceMatch && thirdPlaceMatch.player1 && thirdPlaceMatch.player2) {
    // 3rd place match exists and has players, must be completed
    return !!thirdPlaceMatch.winner;
  }
  
  // No 3rd place match or it's not populated yet, just check finals
  return true;
}

/**
 * Get tournament winner
 */
export function getTournamentWinner(bracket: BracketMatch[]): TournamentParticipant | null {
  const finalsMatch = bracket.find(m => m.round === 'finals');
  if (!finalsMatch || !finalsMatch.winner) return null;
  
  return finalsMatch.player1?.address === finalsMatch.winner 
    ? finalsMatch.player1 
    : finalsMatch.player2 || null;
}

/**
 * Get second place finisher
 */
export function getSecondPlace(bracket: BracketMatch[]): TournamentParticipant | null {
  const finalsMatch = bracket.find(m => m.round === 'finals');
  if (!finalsMatch || !finalsMatch.winner) return null;
  
  return finalsMatch.player1?.address === finalsMatch.winner 
    ? finalsMatch.player2 || null
    : finalsMatch.player1 || null;
}

/**
 * Get third place candidates (semifinal losers)
 */
export function getThirdPlaceCandidates(bracket: BracketMatch[]): TournamentParticipant[] {
  const semifinals = bracket.filter(m => m.round === 'semifinals' && m.winner);
  const losers: TournamentParticipant[] = [];
  
  semifinals.forEach(match => {
    const loser = match.player1?.address === match.winner 
      ? match.player2 
      : match.player1;
    if (loser) losers.push(loser);
  });
  
  return losers;
}

/**
 * Get top N winners from tournament bracket
 * When 4 winners selected: Uses 3rd place match results (for any tournament size)
 */
export function getTopWinners(bracket: BracketMatch[], numberOfWinners: number, tournamentSize?: number): TournamentParticipant[] {
  const winners: TournamentParticipant[] = [];
  
  // 1st place - finals winner
  const first = getTournamentWinner(bracket);
  if (first && numberOfWinners >= 1) winners.push(first);
  
  // 2nd place - finals loser
  const second = getSecondPlace(bracket);
  if (second && numberOfWinners >= 2) winners.push(second);
  
  // For ANY tournament with 4 winners: Use 3rd place match results
  if (numberOfWinners === 4) {
    const thirdPlaceMatch = bracket.find(m => m.matchId === THIRD_PLACE_MATCH_ID);
    
    if (thirdPlaceMatch && thirdPlaceMatch.winner) {
      // 3rd place: Winner of 3rd place match
      const thirdPlace = thirdPlaceMatch.player1?.address === thirdPlaceMatch.winner
        ? thirdPlaceMatch.player1
        : thirdPlaceMatch.player2;
      
      // 4th place: Loser of 3rd place match
      const fourthPlace = thirdPlaceMatch.player1?.address === thirdPlaceMatch.winner
        ? thirdPlaceMatch.player2
        : thirdPlaceMatch.player1;
      
      if (thirdPlace) winners.push(thirdPlace);
      if (fourthPlace) winners.push(fourthPlace);
    }
  }
  
  return winners.slice(0, numberOfWinners);
}

