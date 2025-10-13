export type TournamentStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentSize = 2 | 4 | 8 | 16 | 32;
export type BracketRound = 'round_of_32' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'finals' | 'third_place';

export interface TournamentParticipant {
  address: string;
  characterId: string;
  characterAddress: string;
  nickname: string;
  village: string;
  joinedAt: number;
  transactionSignature: string;
  seedPosition?: number;
}

export interface BracketMatch {
  matchId: string;
  round: BracketRound;
  position: number;
  player1?: TournamentParticipant;
  player2?: TournamentParticipant;
  winner?: string;
  roomId?: string;
  completedAt?: number;
}

export interface PrizeSplit {
  first: number;
  second?: number;
  third?: number;
  fourth?: number;
  fifth?: number;
}

export interface PrizeDistribution {
  address: string;
  amount: number;
  position: string;
  claimed?: boolean;
  claimedAt?: number;
  transactionSignature?: string;
}

export interface Tournament {
  id: string;
  name: string;
  hostAddress: string;
  hostName?: string;
  entryFee: number;
  maxParticipants: TournamentSize;
  numberOfWinners: number;
  currentParticipants: number;
  prizePool: number;
  prizeSplit: PrizeSplit;
  status: TournamentStatus;
  participants: TournamentParticipant[];
  bracket?: BracketMatch[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  description?: string;
  prizesDistributed?: boolean;
  prizeDistribution?: PrizeDistribution[];
  prizesDistributedAt?: number;
}

export interface CreateTournamentRequest {
  name: string;
  entryFee: number;
  maxParticipants: TournamentSize;
  numberOfWinners?: number;
  prizeSplit?: PrizeSplit;
  description?: string;
  hostAddress: string;
  hostName?: string;
}

export interface JoinTournamentRequest {
  tournamentId: string;
  participantAddress: string;
  characterId: string;
  characterAddress: string;
  transactionSignature: string;
}


