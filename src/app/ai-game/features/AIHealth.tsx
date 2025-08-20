import React from 'react';
import { OpponentProgress } from '@/components/ui/opponent-progress';
import { Character, Ability } from '@/lib/characters';

export interface DefenseInventory {
  [defenseType: string]: number;
}

export interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

export interface AIGameState {
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

interface AIHealthProps {
  gameState: AIGameState;
}

const AIHealth: React.FC<AIHealthProps> = ({ gameState }) => {
  const aiCharacter = gameState.ai.character;
  const aiHealth = gameState.ai.currentHealth;
  const maxHealth = aiCharacter?.baseHealth || 200;

  const healthPercentage = aiHealth
    ? Math.max(0, Math.min(100, (aiHealth / maxHealth) * 100))
    : 0;

  return (
    <div>
      <div className='bg-[#3F3F3F] bg-cover h-fit py-2 rounded-[10px] flex justify-between gap-8 items-center px-6 w-full'>
                 <div className='flex gap-[7px] flex-col w-5/6'>
           <div className='bg-[#494949] p-[12px] rounded-[10px] hidden lg:block'>
             <OpponentProgress className='!h-1.5 !rounded-[10px]' value={healthPercentage} />
           </div>
           <div className='flex flex-col-reverse lg:flex-row justify-between items-start lg:items-center'>
             <span className='text-[12px] lg:text-[15px]'>
               AI Opponent
             </span>
             <span className='text-[14px] lg:text-[15px] font-bold'>
               <span className='text-[#BFE528]'>Clan :</span> {aiCharacter?.nickname || 'AI Character'}
             </span>
           </div>
           
                       {/* AI Defense Inventory */}
            <div className='mt-2 min-h-[40px]'>
              <span className='text-[#BFE528] text-xs'>AI Defenses:</span>
              <div className='flex items-center flex-wrap gap-2 mt-1 min-h-[24px]'>
                {Object.entries(gameState.ai?.defenseInventory || {}).map(([type, count]) => {
                  const countNum = count as number;
                  return countNum > 0 && (
                    <div key={type} className='flex items-center space-x-1 bg-[#494949] px-2 py-1 rounded border border-red-500'>
                      <img 
                        src={`/${type}.png`} 
                        alt={type} 
                        className='w-3 h-3'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className='text-white text-xs font-bold'>{countNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
         </div>
        <div className={`flex flex-col rounded-[6px] relative justify-end items-center w-[63px] lg:w-[85px] h-[97px] lg:h-[130px] p-4 overflow-hidden outline-1 outline-[#E8E8E8] outline-offset-[6px] shadow-[0px_4px_7.2px_3px_rgba(191,229,40,0.39)] lg:mt-0 lg:mb-[23px]`}>
          <div className={`absolute -z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full`}>
            <img className={`border-5 border-black h-full w-full rounded-[6px]`} src={`/characters/${aiCharacter?.id}.png`} alt={aiCharacter?.nickname}/>
          </div>
        </div>
      </div>

      <div className='bg-[#494949] p-[12px] rounded-[10px] block lg:hidden mt-[10px]'>
        <OpponentProgress className='!h-1.5 !rounded-[10px]' value={healthPercentage} />
      </div>
    </div>
  );
};

export default AIHealth;
