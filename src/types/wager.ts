export interface WagerGame {
  id: string;
  creatorAddress: string;
  creatorCharacterId: string;
  creatorCharacterAddress: string;
  challengerAddress?: string;
  challengerCharacterId?: string;
  challengerCharacterAddress?: string;
  wagerAmount: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  creatorPaymentSignature?: string;
  challengerPaymentSignature?: string;
  winnerId?: string;
  winnerPaymentSignature?: string;
  gameRoomId?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface CreateWagerRequest {
  creatorAddress: string;
  characterId: string;
  characterAddress: string;
  wagerAmount: number;
  transactionSignature: string;
}

export interface JoinWagerRequest {
  wagerId: string;
  challengerAddress: string;
  characterId: string;
  characterAddress: string;
  transactionSignature: string;
}

export interface CompleteWagerRequest {
  wagerId: string;
  winnerId: string;
}

export interface CompleteWagerResponse {
  success: boolean;
  message?: string;
  winnerPaymentSignature?: string;
  error?: string;
}

