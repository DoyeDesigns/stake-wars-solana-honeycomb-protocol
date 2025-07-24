'use client'

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "./ui/button";

export default function HowToPlay() {
  const [currentPage, setCurrentPage] = useState(0);
  
  const pages = [
    {
      content: (
        <div className="overflow-auto max-h-[300px]">
          <h1 className='m-0 font-bold mb-4'>OBJECTIVES</h1>
          <p className='text-white mb-6'>Outlast your opponent by reducing their health bar to zero and claim the staked tokens.</p>
          
          <h1 className='m-0 font-bold mb-4'>SETUP</h1>
          <p className='text-white mb-2'>1. Choose your character (each with unique special abilities).</p>
          
          <h1 className='m-0 font-bold mb-4'>GAMEPLAY</h1>
          <p className='text-white mb-2'>2. Roll the Dice to Determine First Player</p>
          <ul className='list-disc pl-6 mb-4'>
            <li className='text-white'>The player with the highest number after both players have rolled the dice starts first.</li>
          </ul>

          <p className='text-white mb-2'>2. Roll the Dice</p>
          <ul className='list-disc pl-6 mb-4'>
            <li className='text-white'>Each number on the dice represents either an offensive move (damage) or defensive move (protection).</li>
          </ul>
          
          <p className='text-white mb-2'>3. Choose Your Action</p>
          <ul className='list-disc pl-6'>
            <li className='text-white mb-2'>Decide whether to defend yourself from opponent&apos;s attack or save defense points for later rounds. This work only if you have a defensive ability in your inventory.</li>
          </ul>
        </div>
      )
    },
    {
      content: (
        <div className="overflow-auto max-h-[300px]">
          <h1 className='m-0 font-bold mb-4'>GAMEPLAY</h1>
          <p className='text-white mb-2'>3. Controls</p>
          <ul className='list-disc pl-6 mb-4'>
            <li className='text-white'><span className='font-bold'>Reflect</span> - This reflects the damage to be taken back to the player that attacked.</li>
            <li className='text-white'><span className='font-bold'>Dodge</span> - This allows a player avoid any damage to be taken. The player dodging the attack plays his turn after dodging the attack.</li>
            <li className='text-white'><span className='font-bold'>Block</span> - This reduces the damage to be taken by a 50%. The player misses his turn after using block.</li>
          </ul>

          <p className='text-white mb-2'>4. Strategize</p>
          <ul className='list-disc pl-6 mb-6'>
            <li className='text-white'>Use strategy tips like baiting your opponent into wasting their defenses early or saving an attack for a critical moment.</li>
          </ul>
          
          <p className='text-white mb-2'>5. Winning</p>
          <ul className='list-disc pl-6'>
            <li className='text-white'>Reduce your opponent&apos;s health bar to zero before they do the same to you.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="fixed bottom-5 right-5 lg:right-9">
        <Dialog>
      <DialogTrigger className="connect-button-bg h-11 px-5 rounded-3xl items-center cursor-pointer">
        <div className="flex gap-2 items-center">
          <img src="/info.png" alt="info" className='size-4' />
          <span className={`underline font-bold text-[11px]`}>How to play StakeWars</span>
        </div>
      </DialogTrigger>
      <DialogContent className="overflow-auto bg-linear-to-bl from-violet-500 to-fuchsia-500">
        <DialogTitle className="hidden">Search Game Room</DialogTitle>
          <div className="h-[1px] bg-white my-[22px]"></div>

            <div className="flex-1 overflow-y-auto">
              {pages[currentPage].content}
            </div>

            <div className="h-[1px] bg-white my-[22px]"></div>

            <div className=" flex justify-between items-center pb-3">
              <Button
                className={`p-2 bg-transparent ${currentPage === 0 ? 'invisible' : ''}`}
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              >
                <img src="/arrow-back.png" alt="Previous" width={24} height={24} />
              </Button>

              <div className="flex gap-2 justify-center">
                {pages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentPage ? 'bg-[#6832AE]' : 'bg-white'
                    }`}
                  />
                ))}
              </div>

              <Button
                className={`p-2 bg-transparent ${currentPage === pages.length - 1 ? 'invisible' : ''}`}
                onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
              >
                <img src="/arrow-back.png" className='rotate-180' alt="Next" width={24} height={24} />
              </Button>
            </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
