import React from 'react'
import { GameRoomDocument } from '@/store/online-game-store';
import { OpponentProgress } from '@/components/ui/opponent-progress';
import { compactHash } from '@/components/ConnectButton';
import { useWallet } from '@solana/wallet-adapter-react';

export default function OpponentPlayerHealth({ gameState }: {
  gameState?: GameRoomDocument['gameState']
}) {

  const wallet = useWallet();
  const isPlayer1 = gameState?.player1.id === wallet.publicKey?.toString();
  const isPlayer2 = gameState?.player2.id === wallet.publicKey?.toString();

  const opponentPlayer = isPlayer1 
    ? gameState?.player2 
    : isPlayer2 
      ? gameState?.player1 
      : null;

  const healthPercentage = opponentPlayer?.currentHealth
    ? Math.max(0, Math.min(100, (opponentPlayer.currentHealth / (opponentPlayer.character?.baseHealth || 100)) * 100))
    : 0;

  return (
    <div>
      <div className='bg-[#3F3F3F] bg-cover h-[71px] lg:h-[90px] rounded-[10px] flex justify-between gap-8 items-center px-6 w-full'>
        <div className='flex gap-[7px] flex-col w-5/6'>
        <div className='bg-[#494949] p-[12px] rounded-[10px] hidden lg:block'>
            <OpponentProgress className='!h-1.5 !rounded-[10px]' value={healthPercentage} />
        </div>
        <div className='flex flex-col-reverse lg:flex-row justify-between items-start lg:items-center'>
            <span className='text-[12px] lg:text-[15px]'>
                {compactHash(opponentPlayer?.id || '') || 'Opponent'}
            </span>

            <span className='text-[14px] lg:text-[15px] font-bold'>
                <span className='text-[#BFE528]'>Clan :</span> {opponentPlayer?.character?.nickname || 'Opponent'}
            </span>
        </div>
      </div>
      <div className={`flex flex-col rounded-[6px] relative justify-end items-center w-[63px] lg:w-[85px] h-[97px] lg:h-[130px] p-4 overflow-hidden outline-1 outline-[#E8E8E8] outline-offset-[6px] shadow-[0px_4px_7.2px_3px_rgba(191,229,40,0.39)] -mt-[35px] lg:mt-0 lg:mb-[23px]`}>
                <div className={`absolute -z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full`}>
                  <img className={`border-5 border-black h-full w-full rounded-[6px]`} src={`/characters/${opponentPlayer?.character?.id}.png`} alt={opponentPlayer?.character?.nickname}/>
                </div>
        </div>
    </div>

    <div className='bg-[#494949] p-[12px] rounded-[10px] block lg:hidden mt-[10px]'>
            <OpponentProgress className='!h-1.5 !rounded-[10px]' value={healthPercentage} />
        </div>
    </div>
  )
}
