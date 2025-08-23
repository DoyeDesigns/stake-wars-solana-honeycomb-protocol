'use client'

import React, { useState, useEffect } from 'react';
import useOnlineGameStore from '@/store/useOnlineGame';
import { Ability, CHARACTERS } from '@/lib/characters';
import DiceRollToDetermineFirstTurn from '@/components/FirstTurnDiceRoll';
import DiceRoll from '@/components/DiceRoll';
import DefenseModal from '@/components/DefenceModal';
import { toast } from 'react-toastify';
import PlayerHealth from "./PlayerHealth";
import OpponentPlayerHealth from './OpponentPlayerHealth';
import WonMessage from './WonMessage'
import LostMessage from './LostMessage'
import { useWallet } from '@solana/wallet-adapter-react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LastAttackDetails {
  ability: Ability | null;
  attackingPlayer: 'player1' | 'player2' | null | undefined;
}

const diceImages = ['/one.png', '/two.png', '/three.png', '/four.png', '/five.png', '/six.png']

export default function Gameplay({roomId} : {roomId: string}) {
  const {
    gameState,
    init,
    reset,
    setRoomId
  } = useOnlineGameStore();

  const [showSkipDefenseButton, setShowSkipDefenseButton] = useState(false);
  const [lastAttackDetails, setLastAttackDetails] = useState<LastAttackDetails>({ability: null, attackingPlayer: null});
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defendingPlayer, setDefendingPlayer] = useState('');
  const [showWinner, setShowWinner] = useState(false);
  const [showLoser, setShowLoser] = useState(false);

  const wallet = useWallet();

  const gameRoomId = roomId;

  useEffect(() => {
    if (!wallet.publicKey) {
      // router.push('/wallet');
      toast.info('Please connect your wallet to play the game');
    }
    
    const unsubscribe = init(gameRoomId);
 
    return () => {
      unsubscribe();
      reset();
    };
  }, [gameRoomId, init, reset, wallet.publicKey]);


  useEffect(() => {
    if (gameRoomId) {
      setRoomId(gameRoomId, wallet.publicKey?.toString() as `0${string}`)
    }
  }, [gameRoomId]);

  useEffect(() =>{
    if ((gameState.winner === 'player1' || gameState.winner === 'player2') && gameState.gameStatus === 'finished') {
      toast.info(`${gameState.winner} has won the game`);
      if (wallet.publicKey?.toString() === gameState[gameState?.winner]?.id) {
        setShowWinner(true);
      } else {
        setShowLoser(true);
      }
      return;
    }
  }, [gameState.winner, gameState.gameStatus])

  useEffect(() => {
    if (gameState.gameStatus === 'inProgress') {
      const player1Health = gameState.player1?.currentHealth || 0;
      const player2Health = gameState.player2?.currentHealth || 0;
      
      if (player1Health <= 0 || player2Health <= 0) {
        const winner = player1Health <= 0 ? 'player2' : 'player1';
        useOnlineGameStore.getState().endGame(winner);
        return;
      }
    }

    if (
      gameState.gameStatus === 'inProgress' &&
       gameState.lastAttack !== null &&
      gameState.lastAttack?.ability?.type === 'attack' &&
      gameState.lastAttack?.attackingPlayer
    ) {

      setLastAttackDetails(gameState.lastAttack);
      setShowDefenseModal(false);
      setShowSkipDefenseButton(false);

      toast(`⚔️ ${gameState.lastAttack.attackingPlayer} attacked with ${gameState.lastAttack.ability.name} for ${gameState.lastAttack.ability.value} damage!`);
      
      const attackingPlayer = gameState.lastAttack.attackingPlayer;
      const defendingPlayer = attackingPlayer === 'player1' ? 'player2' : 'player1';

      if (wallet.publicKey?.toString() === gameState[defendingPlayer]?.id) {
        const defenseInventory = gameState[defendingPlayer]?.defenseInventory || {};
        const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);
  
        if (hasDefenses) {
          setDefendingPlayer(defendingPlayer);
          setShowDefenseModal(true);
          setShowSkipDefenseButton(true);
        } else {
          useOnlineGameStore.getState().skipDefense(defendingPlayer, gameState.lastAttack.ability.value, gameState.lastAttack.ability);
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
 
    const defendingPlayer = attackingPlayer === 'player1' ? 'player2' : 'player1';
    const incomingDamage = ability.value;
 
    if (defenseType === null) {
      useOnlineGameStore.getState().skipDefense(defendingPlayer, incomingDamage, ability);
    } else {
      const defendingCharacterId = useOnlineGameStore.getState().gameState?.[defendingPlayer]?.character?.id;
      const defendingCharacter = CHARACTERS.find(char => char.id === defendingCharacterId);

      const defenseAbility = defendingCharacter?.abilities.find(
        a => a.type === 'defense' && a.defenseType === defenseType
      );

      if (!defenseAbility) {
        toast.error(`Defense ability of type "${defenseType}" not found for ${defendingCharacterId}`);
        return;
      }
 
      const wasDefenseSuccessful = await useOnlineGameStore.getState().useDefense(
        defendingPlayer,
        defenseAbility,
        incomingDamage
      );
 
      if (wasDefenseSuccessful) {
        switch (defenseType) {
          case 'dodge':
            toast.info(`${defendingPlayer} dodged the attack with ${defenseAbility.name}`);
            break;
          case 'block':
            toast.info(`${defendingPlayer} blocked the attack with ${defenseAbility.name}`);
            break;
          case 'reflect':
            toast.info(`${defendingPlayer} reflected the attack with ${defenseAbility.name}`);
            break;
        }
      }
    }
 
    setShowDefenseModal(false);
    setLastAttackDetails({ ability: null, attackingPlayer: null });
};

  const copyRoomId = async () => {
    try {
      const link = `${window.location.origin}/lobby?gid=${roomId}`;
      await navigator.clipboard.writeText(link);
      toast.success('Game room ID copied to clipboard!');
    } catch (err) {
      toast.error(`Failed to copy Game room ID: ${err}`);
    }
  };

  return (
    <div className='w-[95%] lg:w-[707px] pb-4 relative mx-auto lg:px-0'>
        <OpponentPlayerHealth gameState={gameState} />
        
        <div className="flex justify-center items-center mt-4 mb-2">
          <Button 
            onClick={copyRoomId}
            className="flex items-center gap-2 bg-[#313030] hover:bg-[#404040] transition-colors duration-200 px-4 py-2 rounded-lg border border-[#E3DEDE] cursor-pointer group"
          >
            <span className="text-white text-xs lg:text-sm font-medium">Room ID:</span>
            <span className="text-[#BFE528] text-xs lg:text-sm font-bold font-mono">
              {roomId.slice(-8)}
            </span>
            <Copy size={20} className='text-white' />
          </Button>
        </div>
      <div className="flex flex-col items-center my-[30px] bg-[#3F3F3F] rounded-[10px] p-6 pt-5">
        <span className="text-[22px] font-bold text-white text-center">
          {/* {gameState.currentTurn === 'player1' ? 'Player 1 turn' : 'Player 2 turn'} */}
        </span>
        <div className='flex gap-[10px] lg:gap-[23px]'>
          {diceImages.map((img, index) => (
            <div key={index} className={`${gameState?.diceRolls?.[wallet.publicKey?.toString() as string] === index  + 1 ? 'outline-2 outline-[#B5A58F] outline-offset-[3px] lg:outline-offset-[6px] rounded-[10px]' : '' } mb-[10px]`}>
              <img src={img} alt={img} className='size-[42px] lg:size-[90px] rounded-[10px] drop-shadow-lg'/>
            </div>
          ))}
        </div>
        <div className='space-y-[14px] flex flex-col justify-center items-center mt-2 bg-[#494949] w-full rounded-[10px] py-[18px]'>
          <DiceRollToDetermineFirstTurn />
          <DiceRoll />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <PlayerHealth  gameState={gameState} />
      </div>
      <div className={`absolute top-0 w-full ${showDefenseModal || showWinner || showLoser ? 'h-full' : ''}`}>
        {showWinner && <WonMessage />}
        {showLoser && <LostMessage/>}
        {showDefenseModal && defendingPlayer === gameState.currentTurn && (
        <DefenseModal
          player={defendingPlayer as 'player1' | 'player2'}
          onDefenseSelect={handleDefenseSelection}
          showSkipButton={showSkipDefenseButton}
        />
      )}
      </div>
    </div>
  );
}
