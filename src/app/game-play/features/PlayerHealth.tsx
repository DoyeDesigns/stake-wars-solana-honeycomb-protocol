import { GameRoomDocument } from "@/store/online-game-store";
import { Progress } from "@/components/ui/progress";
import { compactHash } from "@/components/ConnectButton";
import PlayerAbility from "./PlayerAbility";
import { useWallet } from "@solana/wallet-adapter-react";

export default function PlayerHealth({
  gameState,
}: {
  gameState?: GameRoomDocument["gameState"];
}) {
  const wallet = useWallet();
  const isPlayer1 = gameState?.player1.id === wallet.publicKey?.toString();
  const isPlayer2 = gameState?.player2.id === wallet.publicKey?.toString();

  const currentPlayer = isPlayer1 
    ? gameState?.player1 
    : isPlayer2 
      ? gameState?.player2 
      : null;

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
      <div className="bg-[#3F3F3F] bg-cover h-[129px] lg:h-[267px] rounded-[5px] lg:rounded-[10px] flex justify-between gap-8 items-center px-6 w-full overflow-auto">
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
          userId={currentPlayer?.id as string}
        />

        <div className="space-y-[7px] flex-col hidden lg:block">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold">
            <span className="text-[#BFE528]">Clan :</span>{" "}
            {currentPlayer?.character?.nickname || "Opponent"}
          </span>
          <span className="text-[15px]">
            {compactHash(currentPlayer?.id || "") || "Opponent"}
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
            {currentPlayer?.character?.nickname || "Opponent"}
          </span>
          <span className="text-[15px]">
            {compactHash(currentPlayer?.id || "") || "Opponent"}
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
}
