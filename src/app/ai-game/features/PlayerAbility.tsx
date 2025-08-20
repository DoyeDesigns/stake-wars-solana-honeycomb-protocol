import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react';
import { AIGameState } from './AIHealth';
import { Ability } from '@/lib/characters';

export default function PlayerAbility({ gameState }: {
  gameState: AIGameState
}) {
  const currentPlayer = gameState?.player;
  const wallet = useWallet();

  return (
    <div className='h-fit w-full justify-center items-center'>
      {currentPlayer?.character?.abilities.map((ability: Ability, index: number) => (
        <span
        key={index}
        className={`text-primary m-1 inline-flex items-center h-6 lg:h-8 px-[10px] w-fit text-[8px] lg:text-[10px] font-bold rounded-[5px] ${gameState?.diceRolls?.[wallet.publicKey?.toString() as string] === index + 1 && gameState.gameStatus === 'inProgress' && gameState.lastAttack !== undefined ? 'connect-button-bg' : 'bg-[#5A5A5A]' }`}
      >
        {index + 1}. {ability.name}{" "}
        {ability.type === "attack" ? `[-${ability.value}]` : ""}
      </span>
      ))}
    </div>
  )
}





