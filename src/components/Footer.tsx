'use client'

import Link from 'next/link'
import React from 'react'
import HowToPlay from './HowToPlay'
import { usePathname } from 'next/navigation';
import useOnlineGameStore from '@/store/useOnlineGame';

export default function Footer() {
    const path = usePathname();
    const roomId = useOnlineGameStore();
  return (
    <div className='absolute z-50 bottom-5 w-full justify-between flex items-center px-5 lg:px-9 '>
        <div className={`flex items-center gap-3 ${path === `/game-play/${roomId ? 'hidden' : 'block'}`}`}>
        <Link rel="stylesheet" href="" className="w-fit" ><img src="/x.png" alt="x" /></Link>
        <Link rel="stylesheet" href="" className="w-fit" ><img src="/telegram.png" alt="" /></Link>
        </div>

        <HowToPlay />
    </div>
  )
}
