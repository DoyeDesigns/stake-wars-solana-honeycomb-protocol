import { create } from 'zustand';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Character, Ability } from '@/lib/characters';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';

type UpdateData = {
  [key: string]: number | string | null | object;
};

export interface GameRoomPlayer {
  characterId: string | null;
  role: 'creator' | 'challenger';
  diceRoll?: number;
  wallet?: string;
}

export interface GameRoomDocument {
  id: string;
  createdBy: string;
  status: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  players: {
    [address: string]: GameRoomPlayer;
  };
  createdAt: Timestamp;
  gameState?: GameState;
  creatorTotalWins?: number; 
}

interface DefenseInventory {
  [defenseType: string]: number;
}

interface GameState {
  player1: {
    id: string | null;
    character?: Character;
    currentHealth: number;
    defenseInventory: DefenseInventory;
    skippedDefense?: {
      ability: Ability;
      damage: number;
    };
  };
  player2: {
    id: string | null;
    character?: Character;
    currentHealth: number;
    defenseInventory: DefenseInventory;
    skippedDefense?: {
      ability: Ability;
      damage: number;
    };
  };
  currentTurn: 'player1' | 'player2';
  gameStatus: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  winner: 'player1' | 'player2' | null;
  lastAttack?: {
    ability: Ability;
    attackingPlayer: 'player1' | 'player2';
  };
  diceRolls?: {
    [key: string]: number;
  };
};

const initialGameState: GameState = {
  player1: {
    id: null,
    currentHealth: 0, 
    defenseInventory: {} 
  },
  player2: {
    id: null,
    currentHealth: 0,
    defenseInventory: {}
  },
  currentTurn: 'player1',
  gameStatus: 'waiting',
  winner: null,
};

interface OnlineGameStore {
  roomId: string | null;
  setRoomId: (roomId: string, address: string) => void;
  reset: () => void,
  playerAddress: string | null;
  gameState: GameState;
  rollAndRecordDice: () => Promise<number>;
  checkDiceRollsAndSetTurn: () => void;
  selectCharacters: (roomId: string, character: Character, playerAddress: string) => void;
  performAttack: (attackingPlayer: 'player1' | 'player2', ability: Ability) => void;
  useDefense: (
    defendingPlayer: 'player1' | 'player2',
    defenseAbility: Ability,
    incomingDamage: number
  ) => Promise<boolean>;
  addDefenseToInventory: (player: 'player1' | 'player2', defenseType: string) => void;
  skipDefense: (
    defendingPlayer: 'player1' | 'player2', 
    incomingDamage: number, 
    ability: Ability
  ) => void;
  // getStakeDetails: (roomId: string) => Promise<StakeDetails | undefined>;
  createOnlineGameRoom: (playerAddress: string) => Promise<string>;
  joinGameRoom: (roomId: string, playerAddress: string | null) => Promise<void>;
  findUserRooms: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  findOpenGameRoom: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  init: (roomId: string) => () => void;
}

const useOnlineGameStore = create<OnlineGameStore>((set, get) => ({
  roomId: null,
  setRoomId: (roomId: string, address: string) => {
    set({ 
      roomId: roomId,
      playerAddress: address
    });
  },
  reset: () => set({ gameState: initialGameState, roomId: null }),
  playerAddress: null,
  gameState: initialGameState,

  rollAndRecordDice: async () => {
    const { roomId, playerAddress } = get();
    if (!roomId || !playerAddress) {
      throw new Error('No active game room');
    }
  
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const roomRef = doc(db, 'gameRooms', roomId);
  
    updateDoc(roomRef, {
      [`players.${playerAddress}.diceRoll`]: diceRoll,
      [`gameState.diceRolls.${playerAddress}`]: diceRoll
    });
  
    return diceRoll;
  },

checkDiceRollsAndSetTurn: async () => {
  const { roomId } = get();
  if (!roomId) return;

  const roomRef = doc(db, 'gameRooms', roomId);
  const roomSnapshot = await getDoc(roomRef);
  const roomData = roomSnapshot.data() as GameRoomDocument;

  if (!roomData) throw new Error('Room not found');

  const { players, gameState } = roomData;
  if (!players || !gameState?.diceRolls) {
    toast.error('Players or dice rolls are missing.');
    return;
  }

  const diceRolls = gameState.diceRolls;
  const playerIds = Object.keys(players);

  if (
    playerIds.length !== 2 ||
    playerIds.some((id) => diceRolls[id] === undefined)
  ) {
    toast.error('Not all players have rolled their dice.');
    return;
  }

  const [player1Id, player2Id] = playerIds;
  const playerRoles = {
    player1: { id: player1Id, roll: gameState.diceRolls[player1Id] },
    player2: { id: player2Id, roll: gameState.diceRolls[player2Id] },
  };

  const firstPlayer =
    playerRoles.player1.roll > playerRoles.player2.roll
      ? 'player1'
      : 'player2';

  updateDoc(roomRef, {
    'gameState.currentTurn': firstPlayer,
    'gameState.gameStatus': 'inProgress',
    'status': 'inProgress',
  });
},


  selectCharacters: async (roomId: string, character: Character, playerAddress: string) => {
    if (!playerAddress) {
      throw new Error('User not found');
    }

    if (!character) throw new Error('Invalid character ID');
  
    const roomRef = doc(db, 'gameRooms', roomId);
    // const playerCharacter = CHARACTERS.find((char) => char.id === characterId);
    
  
    const gameRoomDoc = await getDoc(roomRef);
  
    if (!gameRoomDoc.exists()) throw new Error('Game room not found');
  
    const isPlayer1 = gameRoomDoc.data()?.createdBy === playerAddress;
  
    const existingCharacterId = gameRoomDoc.data()?.players?.[playerAddress]?.characterId;
    if (existingCharacterId) {
      throw new Error('Character already selected');
    }
  
  updateDoc(roomRef, {
    [`players.${playerAddress}.characterId`]: character.id,
    [`gameState.${isPlayer1 ? 'player1' : 'player2'}.character`]: character,
    [`gameState.${isPlayer1 ? 'player1' : 'player2'}.currentHealth`]: character.baseHealth,
    [`gameState.${isPlayer1 ? 'player1' : 'player2'}.id`]: playerAddress,
    [`gameState.gameStatus`]: 'character-select',
    'status': 'character-select'
  });
  },


  addDefenseToInventory: async (player, defenseType) => {
    const { roomId, gameState } = get();
  
    if (!roomId) throw new Error('No active game room');
  
    const roomRef = doc(db, 'gameRooms', roomId);
    const nextPlayer = player === 'player1' ? 'player2' : 'player1';
  
    const currentDefenseCount = gameState[player]?.defenseInventory?.[defenseType] || 0;
  
    updateDoc(roomRef, {
      [`gameState.${player}.defenseInventory.${defenseType}`]: currentDefenseCount + 1,
      'gameState.currentTurn': nextPlayer,
    });
  },

  
  skipDefense: async (defendingPlayer, incomingDamage, ability) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error('No active game room');
  
    const roomRef = doc(db, 'gameRooms', roomId);
  
    const opponentPlayer = defendingPlayer === 'player1' ? 'player2' : 'player1'; 
    
    const updatedHealth = gameState[defendingPlayer].currentHealth - incomingDamage;
  
    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.currentHealth`]: updatedHealth,
      [`gameState.${defendingPlayer}.skippedDefense`]: {
        ability,
        damage: incomingDamage
      },
      'gameState.lastAttack': { ability: null, attackingPlayer: null },
      'gameState.currentTurn': defendingPlayer,
    };
  
    if (updatedHealth <= 0) {
      updateData['gameState.gameStatus'] = 'finished';
      updateData['status'] = 'finished';
      updateData['gameState.winner'] = opponentPlayer;
    }
  
      updateDoc(roomRef, updateData);
  },
  
  useDefense: async (defendingPlayer, defenseAbility, incomingDamage) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error('No active game room');
 
    if (!defenseAbility?.defenseType) {
      toast.error('Invalid defense ability provided');
      return false;
    }
 
    const opponentPlayer = defendingPlayer === 'player1' ? 'player2' : 'player1';
    const defenseType = defenseAbility.defenseType;
 
    if ((gameState[defendingPlayer].defenseInventory[defenseType] || 0) <= 0) {
      return false;
    }
 
    const roomRef = doc(db, 'gameRooms', roomId);
 
    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.defenseInventory.${defenseType}`]:
        (gameState[defendingPlayer].defenseInventory[defenseType] || 1) - 1,
      [`gameState.${defendingPlayer}.skippedDefense`]: null,
      'gameState.lastAttack': { ability: null, attackingPlayer: null },
    };
 
    switch (defenseType) {
      case 'dodge':
        updateData['gameState.currentTurn'] = defendingPlayer;
        break;
 
      case 'reflect':
        updateData[`gameState.${opponentPlayer}.currentHealth`] =
          gameState[opponentPlayer].currentHealth - incomingDamage;
        updateData['gameState.currentTurn'] = opponentPlayer;
        break;
 
      case 'block':
        updateData[`gameState.${defendingPlayer}.currentHealth`] =
          gameState[defendingPlayer].currentHealth - Math.max(0, incomingDamage - 25);
        updateData['gameState.currentTurn'] = opponentPlayer;
        break;
 
      default:
        toast.error('Unknown defense type');
        return false;
    }
 
    if (gameState[opponentPlayer].currentHealth - (defenseType === 'reflect' ? incomingDamage : 0) <= 0 ||
        gameState[defendingPlayer].currentHealth -
        (defenseType === 'block' ? Math.max(0, incomingDamage - 25) :
         defenseType === 'dodge' ? 0 : incomingDamage) <= 0) {
      updateData['gameStatus'] = 'finished';
    }
      updateDoc(roomRef, updateData);
      return true;
  },
  
  performAttack: async (attackingPlayer, ability) => {
    const { roomId } = get();
    if (!roomId) throw new Error('No active game room');
  
    const opponentKey = attackingPlayer === 'player1' ? 'player2' : 'player1';
    const roomRef = doc(db, 'gameRooms', roomId);
  
  
    updateDoc(roomRef, {
      'gameState.currentTurn': opponentKey,
      'gameState.lastAttack': { 
        ability, 
        attackingPlayer 
      }
    });
  },

  createOnlineGameRoom: async (playerAddress) => {
    if (!playerAddress) {
      throw new Error('User not found');
    }

    const roomRef = doc(collection(db, 'gameRooms'));
    const roomId = roomRef.id;

    await setDoc(roomRef, {
      id: roomId,
      createdBy: playerAddress,
      status: 'waiting',
      players: {
        [playerAddress]: {
          characterId: null,
          role: 'creator',
          diceRoll: null,
          wallet: playerAddress,
        }
      },
      createdAt: serverTimestamp(),
      gameState: null,
    });

    set({ 
      roomId, 
      playerAddress: playerAddress 
    });

    return roomId;
  },

  joinGameRoom: async (roomId, playerAddress) => {
    if (!playerAddress) {
      throw new Error('User not found');
    }
  
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room does not exist');
    }
  
    const roomData = roomSnap.data();
    const existingPlayers = roomData.players || {};
  
    if (playerAddress === roomData.players[roomData.createdBy]?.wallet && roomData.players[roomData.createdBy]?.role === 'creator') {
      set({
        roomId,
        playerAddress: playerAddress
      });
      return
    } else if (playerAddress === existingPlayers?.[playerAddress]?.wallet && existingPlayers?.[playerAddress]?.role === 'challenger') {
      set({
        roomId,
        playerAddress: playerAddress
      });
      return
    } else {
      await updateDoc(roomRef, {
        [`players.${playerAddress}`]: {
          characterId: null,
          role: 'challenger',
          wallet: playerAddress,
          diceRoll: null,
        },
        status: 'character-select'
      });
      set({
        roomId,
        playerAddress: playerAddress
      });
    }
  },

  findOpenGameRoom: async (playerAddress: string) => {
    if (!playerAddress) throw new Error('User not found');
  
    const roomsRef = collection(db, 'gameRooms');
    const querySnapshot = await getDocs(roomsRef);
    
    const allRooms = querySnapshot.docs.map(doc => ({
      ...doc.data() as GameRoomDocument,
      id: doc.id
    }));
  
    const winCounts = allRooms.reduce((acc, room) => {
      if (room.status === 'finished' && room.gameState?.winner) {
        const winnerAddress = room.gameState.winner === 'player1' 
          ? room.gameState.player1.id 
          : room.gameState.player2.id;
        
        if (winnerAddress) {
          acc.set(winnerAddress, (acc.get(winnerAddress) || 0) + 1);
        }
      }
      return acc;
    }, new Map<string, number>());
  
    return allRooms
      .filter(room => 
        room.status === 'character-select' && 
        room.createdBy !== playerAddress
      )
      .map(room => ({
        ...room,
        creatorTotalWins: winCounts.get(room.createdBy) || 0,
      }));
  },

  findUserRooms: async (playerAddress: string) => {
  
    if (!playerAddress) {
      throw new Error('User not found');
    }
  
    const roomsRef = collection(db, 'gameRooms');
    
    const q = query(
      roomsRef,
      where('players.' + playerAddress, '!=', null) 
    );
  
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      return null;
    }
  
    const rooms = querySnapshot.docs.map(doc => doc.data() as GameRoomDocument);
  
    return rooms;
  },

  init: (roomId) => {
    const roomRef = doc(db, 'gameRooms', roomId);
  
    set((state) => ({
      ...state,
      roomId,
    }));
  
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      const roomData = snapshot.data();
  
      set((state) => {
        if (state.roomId !== roomId) return state;
  
        return {
          gameState: {
            ...state.gameState,
            player1: {
              ...state.gameState.player1,
              ...roomData?.gameState?.player1,
              character: roomData?.gameState?.player1?.character,
            },
            player2: {
              ...state.gameState.player2,
              ...roomData?.gameState?.player2,
              id: roomData?.gameState?.player2?.id || state.gameState.player2.id,
              character: roomData?.gameState?.player2?.character,
            },
            currentTurn: roomData?.gameState?.currentTurn,
            gameStatus: roomData?.gameState?.gameStatus,
            lastAttack: roomData?.gameState?.lastAttack,
            diceRolls: roomData?.gameState?.diceRolls,
            winner: roomData?.gameState?.winner,
            stakeDetails: roomData?.gameState?.stakeDetails,
          },
          roomId,
        };
      });
    });
  
    return unsubscribe;
  }
  , 
}))

export default useOnlineGameStore;