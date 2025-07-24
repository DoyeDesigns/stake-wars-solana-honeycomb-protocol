'use client'

import React from 'react'
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LostMessage() {
  const router = useRouter();

  return (
    <div className='bg-[#191919]/60 h-full w-full top-0 left-0'>
      <div className='flex flex-col justify-center items-center h-full'>
        <div className='flex justify-end w-[60%] -mt-20'>
        </div>
          <img className='-mb-[98px] lg:-mb-[115px] z-30 size-[90px] lg:size-[106px]' src='/sad-look.png' alt='lost-look' width={106} height={106} />
          <img src='/winner-background.png' alt='winner-bg' width={306} height={306} />
          <div className='flex flex-col justify-center items-center gap-4 -mt-48'>
          <div className='flex flex-col justify-center items-center'>
              <span className='text-white font-extrabold text-[16px] lg:text-[22px] text-center'>You Lost!!</span>
          </div>
          <Button onClick={() => router.push('/')} className='border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]'><img src='/rematch.png' alt='winner-bg' width={24} height={24} /> Rematch</Button>
          <Button onClick={() => router.push('/')} className='border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]'><img src='/exit.png' alt='winner-bg' width={24} height={24} /> Exit Game</Button>
          </div>
      </div>
    </div>
  )
}
