import { create } from 'zustand';
import { Character, Ability, CHARACTERS } from '@/lib/characters';
import { toast } from 'react-toastify';

export interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

interface DefenseInventory {
  [defenseType: string]: number;
}

interface AIGameState {
  player: {
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
  ai: {
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
  currentTurn: 'player' | 'ai';
  gameStatus: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  winner: 'player' | 'ai' | null;
  lastAttack?: {
    ability: Ability;
    attackingPlayer: 'player' | 'ai';
  };
  diceRolls?: {
    [key: string]: number;
  };
  isAITurn: boolean;
}

const initialAIGameState: AIGameState = {
  player: {
    id: null,
    currentHealth: 0, 
    defenseInventory: {} 
  },
  ai: {
    id: 'ai-opponent',
    currentHealth: 0,
    defenseInventory: {}
  },
  currentTurn: 'player',
  gameStatus: 'waiting',
  winner: null,
  isAITurn: false
};

interface AIGameStore {
  gameState: AIGameState;
  reset: () => void;
  selectPlayerCharacter: (character: Character, playerAddress: string) => void;
  selectAICharacter: () => void;
  startGame: (playerAddress: string) => void;
  rollAndRecordDice: (playerType: 'player' | 'ai') => Promise<number>;
  checkDiceRollsAndSetTurn: () => void;
  setCurrentTurn: (turn: 'player' | 'ai') => void;
  performAttack: (attackingPlayer: 'player' | 'ai', ability: Ability, powerUp: boolean) => void;
  aiChooseDefense: (incomingDamage: number, ability: Ability) => void;
  useDefense: (
    defendingPlayer: 'player' | 'ai',
    defenseAbility: Ability,
    incomingDamage: number
  ) => Promise<boolean>;
  addDefenseToInventory: (player: 'player' | 'ai', defenseType: string) => void;
  skipDefense: (
    defendingPlayer: 'player' | 'ai', 
    incomingDamage: number, 
    ability: Ability
  ) => void;
  addBuffToPlayer: (player: 'player' | 'ai', name: string, effect: number, duration: number) => void;
  aiMakeMove: () => void;
  awardXP: (winner: 'player' | 'ai') => void;
}

const useAIGameStore = create<AIGameStore>((set, get) => ({
  gameState: initialAIGameState,
  
  reset: () => set({ gameState: initialAIGameState }),

  selectPlayerCharacter: (character: Character, playerAddress: string) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        player: {
          ...state.gameState.player,
          id: playerAddress,
          character: character,
          currentHealth: character.baseHealth
        }
      }
    }));
  },

  selectAICharacter: () => {
    // Randomly select an AI character
    const randomCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    set((state) => ({
      gameState: {
        ...state.gameState,
        ai: {
          ...state.gameState.ai,
          id: 'ai-opponent', // AI doesn't need a real address
          character: randomCharacter,
          currentHealth: randomCharacter.baseHealth
        }
      }
    }));
  },

  startGame: (playerAddress: string) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        gameStatus: 'inProgress',
        player: {
          ...state.gameState.player,
          id: playerAddress
        }
      }
    }));
  },

  rollAndRecordDice: async (playerType: 'player' | 'ai') => {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    set((state) => ({
      gameState: {
        ...state.gameState,
        diceRolls: {
          ...state.gameState.diceRolls,
          [playerType]: diceRoll
        }
      }
    }));
    return diceRoll;
  },

  checkDiceRollsAndSetTurn: () => {
    const { gameState } = get();
    if (!gameState.diceRolls?.player || !gameState.diceRolls?.ai) return;

    const firstPlayer = gameState.diceRolls.player > gameState.diceRolls.ai ? 'player' : 'ai';
    set((state) => ({
      gameState: {
        ...state.gameState,
        currentTurn: firstPlayer,
        gameStatus: 'inProgress',
        isAITurn: firstPlayer === 'ai'
      }
    }));

    // If AI goes first, make its move
    if (firstPlayer === 'ai') {
      setTimeout(() => get().aiMakeMove(), 1500);
    }
  },

  setCurrentTurn: (turn: 'player' | 'ai') => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        currentTurn: turn,
        isAITurn: turn === 'ai'
      }
    }));
  },

  performAttack: (attackingPlayer: 'player' | 'ai', ability: Ability, powerUp: boolean) => {
    const { gameState } = get();
    const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';
    
    let damage = ability.value;
    
    // Apply buffs if any
    if (powerUp && gameState[attackingPlayer].activeBuffs?.length) {
      const totalExtraDamage = gameState[attackingPlayer].activeBuffs.reduce(
        (sum, buff) => sum + buff.effect, 0
      );
      damage += totalExtraDamage;
    }

    // Check if defending player has defenses
    const defenseInventory = gameState[defendingPlayer].defenseInventory;
    const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);

    if (hasDefenses && defendingPlayer === 'player') {
      // Player needs to choose defense
      set((state) => ({
        gameState: {
          ...state.gameState,
          lastAttack: { ability: { ...ability, value: damage }, attackingPlayer },
          currentTurn: defendingPlayer
        }
      }));
    } else if (hasDefenses && defendingPlayer === 'ai') {
      get().aiChooseDefense(damage, ability);
    } else {
      console.log('No defenses available, calling skipDefense for:', defendingPlayer);
      get().skipDefense(defendingPlayer, damage, ability);
    }
  },

  aiChooseDefense: (incomingDamage: number, ability: Ability) => {
    const { gameState } = get();
    const defenseInventory = gameState.ai.defenseInventory;
    const aiHealth = gameState.ai.currentHealth;
    const playerHealth = gameState.player.currentHealth;
    
    let chosenDefense: string | null = null;
    let defenseScore = 0;
    
    const aiHealthPercent = (aiHealth / (gameState.ai.character?.baseHealth || 200)) * 100;
    const playerHealthPercent = (playerHealth / (gameState.player.character?.baseHealth || 200)) * 100;
    
    if (defenseInventory.reflect && defenseInventory.reflect > 0) {
      let reflectScore = 0;
      
      // High damage attacks are perfect for reflect
      if (incomingDamage > 35) reflectScore += 50;
      else if (incomingDamage > 25) reflectScore += 30;
      else if (incomingDamage > 15) reflectScore += 15;
      
      // If AI is low health and player is high health, reflect is risky
      if (aiHealthPercent < 30 && playerHealthPercent > 70) reflectScore -= 20;
      
      // If AI is high health and player is low health, reflect is great
      if (aiHealthPercent > 70 && playerHealthPercent < 30) reflectScore += 25;
      
      if (reflectScore > defenseScore) {
        defenseScore = reflectScore;
        chosenDefense = 'reflect';
      }
    }
    
    if (defenseInventory.block && defenseInventory.block > 0) {
      let blockScore = 0;
      
      // Block is good for medium damage
      if (incomingDamage > 20 && incomingDamage <= 35) blockScore += 30;
      else if (incomingDamage > 15) blockScore += 20;
      
      // If AI is low health, block is safer than reflect
      if (aiHealthPercent < 40) blockScore += 15;
      
      // If AI has more health than player, block is good
      if (aiHealthPercent > playerHealthPercent) blockScore += 10;
      
      if (blockScore > defenseScore) {
        defenseScore = blockScore;
        chosenDefense = 'block';
      }
    }
    
    if (defenseInventory.dodge && defenseInventory.dodge > 0) {
      let dodgeScore = 0;
      
      // Dodge is best for low damage attacks
      if (incomingDamage <= 15) dodgeScore += 40;
      else if (incomingDamage <= 25) dodgeScore += 25;
      
      // If AI is very low health, dodge is safest
      if (aiHealthPercent < 25) dodgeScore += 30;
      
      // If AI is winning (much more health), dodge to preserve advantage
      if (aiHealthPercent > playerHealthPercent + 20) dodgeScore += 15;
      
      // If this is the last defense, be more conservative
      const totalDefenses = Object.values(defenseInventory).reduce((sum, count) => sum + count, 0);
      if (totalDefenses <= 1) dodgeScore += 10;
      
      if (dodgeScore > defenseScore) {
        defenseScore = dodgeScore;
        chosenDefense = 'dodge';
      }
    }
    
    // Sometimes choose not to use defense for strategic reasons
    if (defenseScore < 15) {
      chosenDefense = null;
    }

    if (chosenDefense) {
      const defenseAbility = gameState.ai.character?.abilities.find(
        a => a.type === 'defense' && a.defenseType === chosenDefense
      );
      
      if (defenseAbility) {
        toast.info(`🤖 AI chose to use ${chosenDefense} defense!`);
        get().useDefense('ai', defenseAbility, incomingDamage);
      }
    } else {
      // Check if AI had defenses but chose not to use them
      const hadDefenses = Object.values(defenseInventory).some((count) => count > 0);
      if (hadDefenses) {
        toast.info(`🤖 AI chose to skip defense and take the damage!`);
      } else {
        toast.info(`🤖 AI has no defenses available!`);
      }
      get().skipDefense('ai', incomingDamage, ability);
    }
  },

  useDefense: async (defendingPlayer: 'player' | 'ai', defenseAbility: Ability, incomingDamage: number) => {
    const { gameState } = get();
    const defenseType = defenseAbility.defenseType;
    const attackingPlayer = defendingPlayer === 'player' ? 'ai' : 'player';
    
    // Reduce defense inventory
    const newDefenseInventory = { ...gameState[defendingPlayer].defenseInventory };
    if (defenseType && newDefenseInventory[defenseType]) {
      newDefenseInventory[defenseType]--;
    }

    let damageToApply = 0;
    let reflectedDamage = 0;

    switch (defenseType) {
      case 'dodge':
        damageToApply = 0;
        if (defendingPlayer === 'ai') {
          toast.info(`🤖 AI dodged the attack completely!`);
        }
        break;
      case 'block':
        damageToApply = Math.max(0, incomingDamage - 25);
        if (defendingPlayer === 'ai') {
          toast.info(`🛡️ AI blocked the attack! Damage reduced from ${incomingDamage} to ${damageToApply}`);
        }
        break;
      case 'reflect':
        damageToApply = 0;
        reflectedDamage = incomingDamage;
        if (defendingPlayer === 'ai') {
          toast.info(`🔄 AI reflected the attack! You take ${reflectedDamage} damage!`);
        }
        break;
      default:
        damageToApply = incomingDamage;
    }

    // Apply damage to defending player
    const newHealth = gameState[defendingPlayer].currentHealth - damageToApply;
    
    // Apply reflected damage to attacking player
    const attackingPlayerNewHealth = reflectedDamage > 0 
      ? gameState[attackingPlayer].currentHealth - reflectedDamage 
      : gameState[attackingPlayer].currentHealth;

    // Check for game end
    if (newHealth <= 0 || attackingPlayerNewHealth <= 0) {
      const winner = newHealth <= 0 ? attackingPlayer : defendingPlayer;
      
      // Determine turn based on defense type (same logic as above)
      let nextTurn: 'player' | 'ai';
      
      if (defenseType === 'dodge') {
        nextTurn = defendingPlayer;
      } else if (defenseType === 'reflect') {
        nextTurn = attackingPlayer;
      } else {
        nextTurn = attackingPlayer;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: Math.max(0, newHealth),
            defenseInventory: newDefenseInventory
          },
          lastAttack: undefined,
          currentTurn: nextTurn,
          gameStatus: 'finished',
          winner,
          ...(reflectedDamage > 0 && {
            [attackingPlayer]: {
              ...state.gameState[attackingPlayer],
              currentHealth: Math.max(0, attackingPlayerNewHealth)
            }
          })
        }
      }));

      // Award XP if player wins
      if (winner === 'player') {
        get().awardXP('player');
      }
    } else {
      // Determine turn based on defense type
      let nextTurn: 'player' | 'ai';
      
      if (defenseType === 'dodge') {
        // Dodge keeps the turn with the defending player
        nextTurn = defendingPlayer;
      } else if (defenseType === 'reflect') {
        // Reflect switches turn to the attacking player (who now takes damage)
        nextTurn = attackingPlayer;
      } else {
        // Block and other defenses switch turn to the attacking player
        nextTurn = attackingPlayer;
      }

      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: newHealth,
            defenseInventory: newDefenseInventory
          },
          lastAttack: undefined,
          currentTurn: nextTurn,
          ...(reflectedDamage > 0 && {
            [attackingPlayer]: {
              ...state.gameState[attackingPlayer],
              currentHealth: attackingPlayerNewHealth
            }
          })
        }
      }));

      // If it's now AI's turn, make its move
      if (nextTurn === 'ai') {
        // console.log('AI turn detected in useDefense, triggering AI move...');
        // console.log('Defense type was:', defenseType, 'AI should keep turn and attack again');
        setTimeout(() => get().aiMakeMove(), 1000);
      } else {
        // console.log('AI turn NOT detected in useDefense, nextTurn is:', nextTurn, 'defense type was:', defenseType);
      }
    }

    return true;
  },

  addDefenseToInventory: (player: 'player' | 'ai', defenseType: string) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        [player]: {
          ...state.gameState[player],
          defenseInventory: {
            ...state.gameState[player].defenseInventory,
            [defenseType]: (state.gameState[player].defenseInventory[defenseType] || 0) + 1
          }
        }
      }
    }));
  },

  skipDefense: (defendingPlayer: 'player' | 'ai', incomingDamage: number) => {
    const { gameState } = get();
    const attackingPlayer = defendingPlayer === 'player' ? 'ai' : 'player';
    
    const newHealth = gameState[defendingPlayer].currentHealth - incomingDamage;
    
    // Check if defending player had defenses available (meaning they chose to skip)
    const defenseInventory = gameState[defendingPlayer].defenseInventory;
    const hadDefenses = Object.values(defenseInventory).some((count) => count > 0);
    
    // Determine next turn: 
    // - If they had defenses but chose to skip, they keep their turn
    // - If they had no defenses (forced skip), turn goes to the defending player so they can attack back
    // - When player attacks AI with no defenses, AI should get turn to attack back
    let nextTurn: 'player' | 'ai';
    if (hadDefenses) {
      // They had defenses but chose to skip - they keep their turn
      nextTurn = defendingPlayer;
    } else {
      // They had no defenses - turn goes to the defending player so they can attack back
      nextTurn = defendingPlayer;
    }
    
    // console.log('skipDefense turn logic:', { 
    //   defendingPlayer, 
    //   attackingPlayer, 
    //   hadDefenses, 
    //   nextTurn,
    //   newHealth 
    // });
    
    // Check for game end
    if (newHealth <= 0) {
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: Math.max(0, newHealth)
          },
          lastAttack: undefined,
          currentTurn: nextTurn,
          gameStatus: 'finished',
          winner: attackingPlayer
        }
      }));
      
      // Award XP if player wins
      if (attackingPlayer === 'player') {
        get().awardXP('player');
      }
    } else {
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: newHealth
          },
          lastAttack: undefined,
          currentTurn: nextTurn
        }
      }));

      // If it's now AI's turn, make its move
      if (nextTurn === 'ai') {
        // console.log('AI turn detected in skipDefense, triggering AI move...');
        setTimeout(() => {
          console.log('About to call aiMakeMove from skipDefense...');
          get().aiMakeMove();
        }, 1000);
      } else {
        // console.log('AI turn NOT detected in skipDefense, nextTurn is:', nextTurn);
      }
    }
  },

  addBuffToPlayer: (player: 'player' | 'ai', name: string, effect: number, duration: number) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        [player]: {
          ...state.gameState[player],
          activeBuffs: [
            ...(state.gameState[player].activeBuffs || []),
            { name, effect, remainingTurns: duration }
          ]
        }
      }
    }));
  },

  aiMakeMove: () => {
    const { gameState } = get();
    console.log('aiMakeMove called:', { currentTurn: gameState.currentTurn, gameStatus: gameState.gameStatus });
    if (gameState.currentTurn !== 'ai' || gameState.gameStatus !== 'inProgress') {
      // console.log('AI move blocked - not AI turn or game not in progress');
      return;
    }

    // console.log('AI making move...', { currentTurn: gameState.currentTurn, gameStatus: gameState.gameStatus });

    // Roll dice for AI (following game mechanics)
    get().rollAndRecordDice('ai').then((diceRoll) => {
      const aiCharacter = gameState.ai.character;
      if (!aiCharacter) return;

      const abilities = aiCharacter.abilities;
      if (diceRoll > 0 && diceRoll <= abilities.length) {
        const ability = abilities[diceRoll - 1];

        // AI rolled and selected ability (visible in UI)

        if (ability.type === "defense") {
          if (ability.defenseType) {
            get().addDefenseToInventory('ai', ability.defenseType);
            toast.info(`🛡️ AI added 1 ${ability.defenseType} to its inventory`);
            // Switch turn to player after AI defense
            set((state) => ({
              gameState: {
                ...state.gameState,
                currentTurn: 'player'
              }
            }));
          }
        } else {
          // AI attack logic
          const hasBuffs = gameState.ai.activeBuffs?.length;
          get().performAttack('ai', ability, hasBuffs ? true : false);
          
          if (hasBuffs) {
            const totalExtraDamage = gameState.ai.activeBuffs!.reduce(
              (sum, buff) => sum + buff.effect, 0
            );
            toast.info(`⚡ AI used buffs to add ${totalExtraDamage} extra damage!`);
          }
        }
      }
    });
  },

  awardXP: async (winner: 'player' | 'ai') => {
    if (winner === 'player') {
      // Award XP to player (this would integrate with Honeycomb Protocol)
      const xpReward = 50; // Base XP for winning
      toast.success(`🎉 Victory! You earned ${xpReward} XP!`);
      
      // TODO: Integrate with Honeycomb Protocol to record XP on-chain
      // This would involve:
      // 1. Creating a transaction to update the character's XP
      // 2. Recording the victory on-chain
      // 3. Potentially updating character traits/levels
      
      try {
        // Example integration (commented out for now):
        // const { createUpdateCharacterXPTransaction } = await client.createUpdateCharacterXPTransaction({
        //   data: {
        //     character: gameState.player.character?.address,
        //     xpGained: xpReward,
        //     reason: 'AI Victory',
        //     authority: wallet.publicKey.toString()
        //   }
        // });
        // await sendClientTransactions(client, wallet, createUpdateCharacterXPTransaction);
        
        console.log(`Player earned ${xpReward} XP for defeating AI`);
      } catch (error) {
        console.error('Failed to record XP on-chain:', error);
        // Still show success message even if on-chain recording fails
      }
    }
  }
}));

export default useAIGameStore;
