'use client'

import useOnlineGameStore from "@/store/online-game-store";
import { toast } from 'react-toastify';
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";

const DiceRollToDetermineFirstTurn = () => {
    const { checkDiceRollsAndSetTurn, rollAndRecordDice, gameState } = useOnlineGameStore();

    const wallet = useWallet();
  
    const hasPlayerRolled = (() => {
      if (gameState?.diceRolls && wallet.connected !== null) {
        return wallet.publicKey?.toString() as string in gameState.diceRolls;
      }
      return false;
    })();
  
    const handleRollDice = async () => {
      if (hasPlayerRolled) {
        toast.info('You have already rolled the dice.');
        return;
      }
  
      try {
        rollAndRecordDice();
        checkDiceRollsAndSetTurn();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Error rolling dice: ${error}`);
        }
      }
    };
  
    return (
      <div className={`flex items-center gap-5`}>
        <Button
          disabled={hasPlayerRolled} 
          className="bg-[#7531CD] h-[40px] w-[230px] lg:w-[308px] !rounded lg:h-[36px] text-white py-2 px-4 !cursor-pointer disabled:bg-[#7531CD]/85 disabled:text-white" 
          onClick={() => handleRollDice()}
          >Roll Dice to decide first player
        </Button>
      </div>
    );
  };
  
  export default DiceRollToDetermineFirstTurn;