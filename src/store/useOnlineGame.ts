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

export interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

export type UpdateData = {
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
  rewardsClaimed?: boolean;
  rewardsClaimedAt?: number;
  rewardsClaimedBy?: string;
  isWagerMatch?: boolean;
  isTournamentMatch?: boolean;
  wagerId?: string;
  tournamentId?: string;
  matchId?: string;
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
    activeBuffs?: Buff[];
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
    activeBuffs?: Buff[];
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
  performAttack: (attackingPlayer: 'player1' | 'player2', ability: Ability, powerUp: boolean) => void;
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
  addBuffToPlayer: (player: 'player1' | 'player2', name: string, effect: number, duration: number) => void;
  createOnlineGameRoom: (playerAddress: string) => Promise<string>;
  joinGameRoom: (roomId: string, playerAddress: string | null) => Promise<void>;
  findUserRooms: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  findOpenGameRoom: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  validatePlayerInRoom: (playerAddress: string, roomData: GameRoomDocument) => void;
  endGame: (winner: 'player1' | 'player2') => void;
  init: (roomId: string) => () => void;
}

const useOnlineGameStore = create<OnlineGameStore>((set, get) => ({
  roomId: null,
  setRoomId: (roomId: string, address: string) => {
    set({
      roomId: roomId,
      playerAddress: address,
    });
  },
  reset: () => set({ gameState: initialGameState, roomId: null }),
  playerAddress: null,
  gameState: initialGameState,

  rollAndRecordDice: async () => {
    const { roomId, playerAddress } = get();
    if (!roomId || !playerAddress) {
      throw new Error("No active game room");
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const roomRef = doc(db, "gameRooms", roomId);

    updateDoc(roomRef, {
      [`players.${playerAddress}.diceRoll`]: diceRoll,
      [`gameState.diceRolls.${playerAddress}`]: diceRoll,
    });

    return diceRoll;
  },

  checkDiceRollsAndSetTurn: async () => {
    const { roomId } = get();
    if (!roomId) return;

    const roomRef = doc(db, "gameRooms", roomId);
    const roomSnapshot = await getDoc(roomRef);
    const roomData = roomSnapshot.data() as GameRoomDocument;

    if (!roomData) throw new Error("Room not found");

    const { players, gameState } = roomData;
    if (!players || !gameState?.diceRolls) {
      toast.error("Players or dice rolls are missing.");
      return;
    }

    const diceRolls = gameState.diceRolls;
    const playerIds = Object.keys(players);

    if (
      playerIds.length !== 2 ||
      playerIds.some((id) => diceRolls[id] === undefined)
    ) {
      toast.error("Not all players have rolled their dice.");
      return;
    }

    const creatorId = roomData.createdBy;
    const joinerId = playerIds.find((id) => id !== creatorId);

    if (!joinerId) {
      toast.error("Could not determine both players.");
      return;
    }

    const playerRoles = {
      player1: { id: creatorId, roll: gameState.diceRolls[creatorId] },
      player2: { id: joinerId, roll: gameState.diceRolls[joinerId] },
    };

    const firstPlayer =
      playerRoles.player1.roll > playerRoles.player2.roll
        ? "player1"
        : "player2";

    updateDoc(roomRef, {
      "gameState.currentTurn": firstPlayer,
      "gameState.gameStatus": "inProgress",
      status: "inProgress",
    });
  },

  selectCharacters: async (
    roomId: string,
    character: Character,
    playerAddress: string
  ) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    if (!character) throw new Error("Invalid character ID");

    const roomRef = doc(db, "gameRooms", roomId);
    // const playerCharacter = CHARACTERS.find((char) => char.id === characterId);

    const gameRoomDoc = await getDoc(roomRef);

    if (!gameRoomDoc.exists()) throw new Error("Game room not found");

    const isPlayer1 = gameRoomDoc.data()?.createdBy === playerAddress;

    const existingCharacterId =
      gameRoomDoc.data()?.players?.[playerAddress]?.characterId;
    if (existingCharacterId) {
      throw new Error("Character already selected");
    }

    updateDoc(roomRef, {
      [`players.${playerAddress}.characterId`]: character.id,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.character`]: character,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.currentHealth`]:
        character.baseHealth,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.id`]: playerAddress,
      [`gameState.gameStatus`]: "character-select",
      status: "character-select",
    });
  },

  addDefenseToInventory: async (player, defenseType) => {
    const { roomId, gameState } = get();

    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);
    const nextPlayer = player === "player1" ? "player2" : "player1";

    const currentDefenseCount =
      gameState[player]?.defenseInventory?.[defenseType] || 0;

    updateDoc(roomRef, {
      [`gameState.${player}.defenseInventory.${defenseType}`]:
        currentDefenseCount + 1,
      "gameState.currentTurn": nextPlayer,
    });
  },

  addBuffToPlayer: async (
    player: "player1" | "player2",
    name: string,
    effect: number,
    duration: number
  ) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);
    const currentBuffs = gameState[player]?.activeBuffs || [];

    const newBuff: Buff = {
      name,
      effect,
      remainingTurns: duration,
    };

    await updateDoc(roomRef, {
      [`gameState.${player}.activeBuffs`]: [...currentBuffs, newBuff],
    });
  },

  skipDefense: async (defendingPlayer, incomingDamage, ability) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);

    const opponentPlayer =
      defendingPlayer === "player1" ? "player2" : "player1";

    const updatedHealth =
      gameState[defendingPlayer].currentHealth - incomingDamage;

    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.currentHealth`]: updatedHealth,
      [`gameState.${defendingPlayer}.skippedDefense`]: {
        ability,
        damage: incomingDamage,
      },
      "gameState.lastAttack": { ability: null, attackingPlayer: null },
      "gameState.currentTurn": defendingPlayer,
    };

    if (updatedHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = opponentPlayer;
    }

    updateDoc(roomRef, updateData);
  },

  useDefense: async (defendingPlayer, defenseAbility, incomingDamage) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    if (!defenseAbility?.defenseType) {
      toast.error("Invalid defense ability provided");
      return false;
    }

    const opponentPlayer =
      defendingPlayer === "player1" ? "player2" : "player1";
    const defenseType = defenseAbility.defenseType;

    if ((gameState[defendingPlayer].defenseInventory[defenseType] || 0) <= 0) {
      return false;
    }

    const roomRef = doc(db, "gameRooms", roomId);

    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.defenseInventory.${defenseType}`]:
        (gameState[defendingPlayer].defenseInventory[defenseType] || 1) - 1,
      [`gameState.${defendingPlayer}.skippedDefense`]: null,
      "gameState.lastAttack": { ability: null, attackingPlayer: null },
    };

    let defendingPlayerNewHealth = gameState[defendingPlayer].currentHealth;
    let opponentPlayerNewHealth = gameState[opponentPlayer].currentHealth;

    switch (defenseType) {
      case "dodge":
        updateData["gameState.currentTurn"] = defendingPlayer;
        // No damage taken
        break;

      case "reflect":
        opponentPlayerNewHealth =
          gameState[opponentPlayer].currentHealth - incomingDamage;
        updateData[`gameState.${opponentPlayer}.currentHealth`] =
          opponentPlayerNewHealth;
        updateData["gameState.currentTurn"] = opponentPlayer;
        break;

      case "block":
        const blockedDamage = Math.max(0, incomingDamage - 25);
        defendingPlayerNewHealth =
          gameState[defendingPlayer].currentHealth - blockedDamage;
        updateData[`gameState.${defendingPlayer}.currentHealth`] =
          defendingPlayerNewHealth;
        updateData["gameState.currentTurn"] = opponentPlayer;
        break;

      default:
        toast.error("Unknown defense type");
        return false;
    }

    // Check for game over conditions
    if (opponentPlayerNewHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = defendingPlayer;
    } else if (defendingPlayerNewHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = opponentPlayer;
    }

    updateDoc(roomRef, updateData);
    return true;
  },

  performAttack: async (attackingPlayer, ability, powerUp) => {
    const { roomId } = get();
    const { gameState } = get();
    if (!roomId) throw new Error("No active game room");

    // Prevent attacks if game is already finished
    if (gameState.gameStatus === "finished") {
      toast.error("Game is already finished");
      return;
    }

    const opponentKey = attackingPlayer === "player1" ? "player2" : "player1";
    const roomRef = doc(db, "gameRooms", roomId);

    if (powerUp) {
      const updatedBuffs = (gameState[attackingPlayer].activeBuffs ?? [])
        .map((buff) => ({
          ...buff,
          remainingTurns: buff.remainingTurns - 1,
        }))
        .filter((buff) => buff.remainingTurns > 0);

      updateDoc(roomRef, {
        "gameState.currentTurn": opponentKey,
        "gameState.lastAttack": {
          ability,
          attackingPlayer,
        },
        [`gameState.${attackingPlayer}.activeBuffs`]: updatedBuffs,
      });
    } else {
      updateDoc(roomRef, {
        "gameState.currentTurn": opponentKey,
        "gameState.lastAttack": {
          ability,
          attackingPlayer,
        },
      });
    }
  },

  createOnlineGameRoom: async (playerAddress) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomRef = doc(collection(db, "gameRooms"));
    const roomId = roomRef.id;

    await setDoc(roomRef, {
      id: roomId,
      createdBy: playerAddress,
      status: "waiting",
      players: {
        [playerAddress]: {
          characterId: null,
          role: "creator",
          diceRoll: null,
          wallet: playerAddress,
        },
      },
      createdAt: serverTimestamp(),
      gameState: null,
    });

    set({
      roomId,
      playerAddress: playerAddress,
    });

    return roomId;
  },

  joinGameRoom: async (roomId, playerAddress) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomRef = doc(db, "gameRooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Room does not exist");
    }

    const roomData = roomSnap.data() as GameRoomDocument;

    if (roomData?.gameState?.player1 && roomData?.gameState?.player1.id === playerAddress) {
      throw new Error("You're already in this game");
    }

    await updateDoc(roomRef, {
      [`players.${playerAddress}`]: {
        characterId: null,
        role: "challenger",
        wallet: playerAddress,
        diceRoll: null,
      },
      status: "character-select",
    });

    set({
      roomId,
      playerAddress: playerAddress,
    });
  },

  validatePlayerInRoom(playerAddress, roomData) {
    const creator = roomData.players?.[roomData.createdBy];
    const challenger = roomData.players?.[playerAddress];

    const roomId = roomData.id;

    if (
      creator &&
      playerAddress === creator.wallet &&
      creator.role === "creator"
    ) {
      set({
        roomId,
        playerAddress,
      });
      return true;
    }

    if (
      challenger &&
      playerAddress === challenger.wallet &&
      challenger.role === "challenger"
    ) {
      set({
        roomId,
        playerAddress,
      });
      return true;
    }

    throw new Error("You are not a participant in this room");
  },

  findOpenGameRoom: async (playerAddress: string) => {
    if (!playerAddress) throw new Error("User not found");

    const roomsRef = collection(db, "gameRooms");
    const querySnapshot = await getDocs(roomsRef);

    const allRooms = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as GameRoomDocument),
      id: doc.id,
    }));

    const winCounts = allRooms.reduce((acc, room) => {
      if (room.status === "finished" && room.gameState?.winner) {
        const winnerAddress =
          room.gameState.winner === "player1"
            ? room.gameState.player1.id
            : room.gameState.player2.id;

        if (winnerAddress) {
          acc.set(winnerAddress, (acc.get(winnerAddress) || 0) + 1);
        }
      }
      return acc;
    }, new Map<string, number>());

    return allRooms
      .filter(
        (room) =>
          room.status === "character-select" && room.createdBy !== playerAddress
      )
      .map((room) => ({
        ...room,
        creatorTotalWins: winCounts.get(room.createdBy) || 0,
      }));
  },

  findUserRooms: async (playerAddress: string) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomsRef = collection(db, "gameRooms");

    const q = query(roomsRef, where("players." + playerAddress, "!=", null));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const rooms = querySnapshot.docs.map(
      (doc) => doc.data() as GameRoomDocument
    );

    return rooms;
  },

  endGame: async (winner: "player1" | "player2") => {
    const { roomId } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);

    await updateDoc(roomRef, {
      "gameState.gameStatus": "finished",
      status: "finished",
      "gameState.winner": winner,
    });
  },

  init: (roomId) => {
    const roomRef = doc(db, "gameRooms", roomId);

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
              id:
                roomData?.gameState?.player2?.id || state.gameState.player2.id,
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
  },
}));

export default useOnlineGameStore;