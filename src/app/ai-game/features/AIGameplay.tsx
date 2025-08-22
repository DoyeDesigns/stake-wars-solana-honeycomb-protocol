'use client'

import React, { useState, useEffect } from 'react';
import useAIGameStore from '@/store/useAIGame';
import { Ability } from '@/lib/characters';
import AIFirstTurnDiceRoll from './AIFirstTurnDiceRoll';
import AIDiceRoll from './AIDiceRoll';
import AIDefenseModal from './AIDefenseModal';
import { toast } from 'react-toastify';
import PlayerHealth from "./PlayerHealth";
import AIHealth from './AIHealth';
import AILostMessage from './AILostMessage';
import AIWonMessage from './AIWonMessage';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

interface LastAttackDetails {
  ability: Ability | null;
  attackingPlayer: 'player' | 'ai' | null | undefined;
}

const diceImages = ['/one.png', '/two.png', '/three.png', '/four.png', '/five.png', '/six.png']

export default function AIGameplay() {
  const {
    gameState,
    reset,
  } = useAIGameStore();

  const [showSkipDefenseButton, setShowSkipDefenseButton] = useState(false);
  const [lastAttackDetails, setLastAttackDetails] = useState<LastAttackDetails>({ability: null, attackingPlayer: null});
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defendingPlayer, setDefendingPlayer] = useState('');
  const [showWinner, setShowWinner] = useState(false);
  const [showLoser, setShowLoser] = useState(false);

  const wallet = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!wallet.connected) {
      toast.info('Please connect your wallet to play the game');
      router.push('/');
    }
  }, [wallet.connected, router]);

  useEffect(() => {
    if (gameState.winner === 'player' || gameState.winner === 'ai' && gameState.gameStatus === 'finished') {
      toast.info(`${gameState.winner === 'player' ? 'You' : 'AI'} has won the game`);
      if (gameState.winner === 'player') {
        setShowWinner(true);
      } else {
        setShowLoser(true);
      }
      return;
    }
  }, [gameState.winner, gameState.gameStatus])

  // Auto-trigger AI turn when it's AI's turn
  useEffect(() => {
    // console.log('Turn changed:', { currentTurn: gameState.currentTurn, gameStatus: gameState.gameStatus });
    if (gameState.currentTurn === 'ai' && gameState.gameStatus === 'inProgress') {
      // console.log('AI turn detected, triggering AI move...');
      // Small delay to show the turn change
      setTimeout(() => {
        useAIGameStore.getState().aiMakeMove();
      }, 1500);
    }
  }, [gameState.currentTurn, gameState.gameStatus]);

  useEffect(() => {
    if (
      gameState.gameStatus === 'inProgress' &&
       gameState.lastAttack !== null &&
      gameState.lastAttack?.ability?.type === 'attack' &&
      gameState.lastAttack?.attackingPlayer
    ) {

      setLastAttackDetails(gameState.lastAttack);
      setShowDefenseModal(false);
      setShowSkipDefenseButton(false);

      toast(`⚔️ ${gameState.lastAttack.attackingPlayer === 'player' ? 'You' : 'AI'} attacked with ${gameState.lastAttack.ability.name} for ${gameState.lastAttack.ability.value} damage!`);
      
      const attackingPlayer = gameState.lastAttack.attackingPlayer;
      const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';

      if (defendingPlayer === 'player') {
        const defenseInventory = gameState[defendingPlayer]?.defenseInventory || {};
        const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);
  
        if (hasDefenses) {
          setDefendingPlayer(defendingPlayer);
          setShowDefenseModal(true);
          setShowSkipDefenseButton(true);
        } else {
          useAIGameStore.getState().skipDefense(defendingPlayer, gameState.lastAttack.ability.value, gameState.lastAttack.ability);
          toast.warn(`You took -${gameState.lastAttack.ability.value} damage`)
        }
      }
    } else {
      setShowDefenseModal(false);
    }
  }, [gameState.lastAttack]);

  const handleDefenseSelection = async (defenseType: string | null) => {
    const { ability, attackingPlayer } = lastAttackDetails;
    if (!ability || !attackingPlayer) return;
 
    const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';
    const incomingDamage = ability.value;
 
    if (defenseType === null) {
      useAIGameStore.getState().skipDefense(defendingPlayer, incomingDamage, ability);
    } else {
      const defendingCharacterId = useAIGameStore.getState().gameState?.[defendingPlayer]?.character?.id;
      const defendingCharacter = useAIGameStore.getState().gameState?.[defendingPlayer]?.character;

      const defenseAbility = defendingCharacter?.abilities.find(
        a => a.type === 'defense' && a.defenseType === defenseType
      );

      if (!defenseAbility) {
        toast.error(`Defense ability of type "${defenseType}" not found for ${defendingCharacterId}`);
        return;
      }
 
      const wasDefenseSuccessful = await useAIGameStore.getState().useDefense(
        defendingPlayer,
        defenseAbility,
        incomingDamage
      );
 
      if (wasDefenseSuccessful) {
        switch (defenseType) {
          case 'dodge':
            toast.info(`You dodged the attack with ${defenseAbility.name}`);
            break;
          case 'block':
            toast.info(`You blocked the attack with ${defenseAbility.name}`);
            break;
          case 'reflect':
            toast.info(`You reflected the attack with ${defenseAbility.name}`);
            break;
        }
      }
    }
 
    setShowDefenseModal(false);
    setLastAttackDetails({ ability: null, attackingPlayer: null });
  };

  const handleBackToLobby = () => {
    reset();
    router.push('/lobby');
  };

  return (
    <div className='w-[95%] lg:w-[707px] relative mx-auto lg:px-0'>
        <AIHealth gameState={gameState} />
      <div className="flex flex-col items-center my-[30px] bg-[#3F3F3F] rounded-[10px] p-6 pt-5">
        <span className="text-[22px] font-bold text-white text-center">
          {/* {gameState.currentTurn === 'player' ? 'Your Turn' : 'AI Turn'} */}
        </span>
        <div className='flex gap-[10px] lg:gap-[23px]'>
          {diceImages.map((img, index) => {
            const diceNumber = index + 1;
            const playerRolled = gameState?.diceRolls?.['player'] === diceNumber;
            const aiRolled = gameState?.diceRolls?.['ai'] === diceNumber;
            const sameRoll = playerRolled && aiRolled;
            
            return (
              <div key={index} className={`relative mb-[10px]`}>
                {/* Player outline */}
                {playerRolled && !sameRoll && (
                  <div className="absolute inset-0 outline-2 outline-[#B5A58F] outline-offset-[3px] lg:outline-offset-[6px] rounded-[10px] pointer-events-none"></div>
                )}
                
                {/* AI outline */}
                {aiRolled && !sameRoll && (
                  <div className="absolute inset-0 outline-2 outline-red-500 outline-offset-[3px] lg:outline-offset-[6px] rounded-[10px] pointer-events-none"></div>
                )}
                
                {/* Same roll - offset outlines */}
                {sameRoll && (
                  <>
                    <div className="absolute inset-0 outline-2 outline-[#B5A58F] outline-offset-[3px] lg:outline-offset-[6px] rounded-[10px] pointer-events-none"></div>
                    <div className="absolute inset-0 outline-2 outline-red-500 outline-offset-[6px] lg:outline-offset-[9px] rounded-[10px] pointer-events-none"></div>
                  </>
                )}
                
                <img src={img} alt={img} className='size-[42px] lg:size-[90px] rounded-[10px] drop-shadow-lg'/>
              </div>
            );
          })}
        </div>
        <div className='space-y-[14px] flex flex-col justify-center items-center mt-2 bg-[#494949] w-full rounded-[10px] py-[18px]'>
          <AIFirstTurnDiceRoll />
          <AIDiceRoll />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <PlayerHealth gameState={gameState} />
      </div>
      
      <div className={`absolute top-0 w-full ${showDefenseModal || showWinner || showLoser ? 'h-full' : ''}`}>
        {showWinner && <AIWonMessage />}
        {showLoser && <AILostMessage onBackToLobby={handleBackToLobby} />}
        {showDefenseModal && defendingPlayer === gameState.currentTurn && (
          <AIDefenseModal
            player={defendingPlayer as 'player' | 'ai'}
            onDefenseSelect={handleDefenseSelection}
            showSkipButton={showSkipDefenseButton}
          />
        )}
      </div>
    </div>
  );
}
