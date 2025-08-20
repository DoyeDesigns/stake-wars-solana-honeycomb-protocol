import React from 'react';
import { Progress } from "@/components/ui/progress";
import { compactHash } from "@/components/ConnectButton";
import PlayerAbility from "./PlayerAbility";
import { AIGameState } from './AIHealth';
import { Buff } from './AIHealth';

interface PlayerHealthProps {
  gameState: AIGameState;
}

const PlayerHealth: React.FC<PlayerHealthProps> = ({ gameState }) => {
  const currentPlayer = gameState?.player;

  const healthPercentage = currentPlayer?.currentHealth
    ? Math.max(
        0,
        Math.min(
          100,
          (currentPlayer.currentHealth /
            (currentPlayer.character?.baseHealth || 100)) *
            100
        )
      )
    : 0;

  return (
    <div>
      <div className="bg-[#3F3F3F] bg-cover min-h-fit lg:h-[267px] rounded-[5px] lg:rounded-[10px] flex justify-between gap-8 items-center px-6 py-2 w-full overflow-auto">
        <div
          className={`flex flex-col rounded-[6px] relative justify-end items-center w-[63px] lg:w-[132px] h-[97px] lg:h-[195px] p-4 overflow-hidden outline-1 outline-[#E8E8E8] outline-offset-[6px] shadow-[0px_4px_7.2px_3px_rgba(191,229,40,0.39)]`}
        >
          <div
            className={`absolute -z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full`}
          >
            <img
              className={`border-5 border-black h-full w-full rounded-[6px]`}
              src={`/characters/${currentPlayer?.character?.id}.png`}
              alt={currentPlayer?.character?.nickname}
            />
          </div>
        </div>

        <div className="flex gap-[7px] flex-col w-5/6 ">
          <PlayerAbility
            gameState={gameState}
          />

                     {/* Player Defense Inventory */}
           <div className="mt-2 min-h-[40px]">
             <span className="text-[#BFE528] text-xs">Your Defenses:</span>
             <div className="flex items-center flex-wrap gap-2 mt-1 min-h-[24px]">
               {Object.entries(currentPlayer?.defenseInventory || {}).map(([type, count]) => {
                 const countNum = count as number;
                 return countNum > 0 && (
                   <div key={type} className="flex items-center space-x-1 bg-[#494949] px-2 py-1 rounded border border-[#BFE528]">
                     <img 
                       src={`/${type}.png`} 
                       alt={type} 
                       className="w-3 h-3"
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                       }}
                     />
                     <span className="text-white text-xs font-bold">{countNum}</span>
                   </div>
                 );
               })}
             </div>
           </div>

          {currentPlayer?.activeBuffs?.length as number > 0 && (
            <div>
              <span className="text-[#BFE528] text-xs my-3">Active power up</span>
              <div className=" flex items-center flex-wrap gap-2 my-2">
                {currentPlayer?.activeBuffs?.map((powerup: Buff, index: number) => (
                <div key={index} className="border-[0.7px] py-1 px-3 text-white text-xs border-white bg-[#BFE52833] rounded-lg w-fit">
                  {powerup.name}(+{powerup.effect}): {powerup.remainingTurns} 
                </div>
              ))}
              </div>
            </div>
          )}

          <div className="space-y-[7px] flex-col hidden lg:block">
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-bold">
                <span className="text-[#BFE528]">Clan :</span>{" "}
                {currentPlayer?.character?.nickname || "Your Character"}
              </span>
              <span className="text-[15px]">
                {compactHash(currentPlayer?.id || "") || "You"}
              </span>
            </div>
            <div className="bg-[#494949] p-[12px] rounded-[10px]">
              <Progress
                className="!h-1.5 !rounded-[10px]"
                value={healthPercentage}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-[7px] flex-col block lg:hidden mt-5">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold">
            <span className="text-[#BFE528]">Clan :</span>{" "}
            {currentPlayer?.character?.nickname || "Your Character"}
          </span>
          <span className="text-[15px]">
            {compactHash(currentPlayer?.id || "") || "You"}
          </span>
        </div>
        <div className="bg-[#494949] p-[12px] rounded-[10px]">
          <Progress
            className="!h-1.5 !rounded-[10px]"
            value={healthPercentage}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerHealth;
