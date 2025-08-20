"use client";
import React, { useState } from "react";
import useAIGameStore from "@/store/useAIGame";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

const AIFirstTurnDiceRoll: React.FC = () => {
  const {
    rollAndRecordDice,
    gameState,
    checkDiceRollsAndSetTurn
  } = useAIGameStore();
  
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [playerRolled, setPlayerRolled] = useState(false);
  const [aiRolled, setAiRolled] = useState(false);

  const handlePlayerRoll = async () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);
    setPlayerRolled(true);

    try {
      const rolledDiceNumber = await rollAndRecordDice('player');
      toast.info(`You rolled: ${rolledDiceNumber}`);
      
      // AI automatically rolls after player
      setTimeout(async () => {
        const aiRoll = await rollAndRecordDice('ai');
        setAiRolled(true);
        toast.info(`AI rolled: ${aiRoll}`);
      }, 1000);

      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error rolling dice: ${error.message}`);
      }
      setIsButtonDisabled(false);
      setPlayerRolled(false);
    }
  };

  // Check if both players have rolled for first turn
  const bothPlayersRolled = gameState.diceRolls?.player && gameState.diceRolls?.ai;
  const gameNotStarted = gameState.gameStatus === 'waiting' || gameState.gameStatus === 'character-select';

  if (!gameNotStarted) {
    return null; // Don't show this component during the actual game
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-white text-lg font-semibold mb-2">
        Roll Dice to Determine First Turn
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <div className="text-white text-sm">
          {playerRolled ? `You rolled: ${gameState.diceRolls?.player}` : 'You haven\'t rolled yet'}
        </div>
        <div className="text-white text-sm">
          {aiRolled ? `AI rolled: ${gameState.diceRolls?.ai}` : 'AI hasn\'t rolled yet'}
        </div>
      </div>

      <Button
        onClick={handlePlayerRoll}
        disabled={isButtonDisabled || playerRolled}
        className="bg-[#B91770] hover:bg-[#B91770]/80 text-white font-bold py-2 px-6 rounded-lg"
      >
        {isButtonDisabled ? "Rolling..." : playerRolled ? "Rolled!" : "Roll Dice"}
      </Button>

      {bothPlayersRolled && (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-white text-lg font-bold">
            {gameState.diceRolls?.player && gameState.diceRolls?.ai && 
              (gameState.diceRolls.player > gameState.diceRolls.ai 
                ? "🎉 You go first!" 
                : "🤖 AI goes first!")
            }
          </div>
          <div className="text-white text-sm">
            {gameState.diceRolls?.player && gameState.diceRolls?.ai && 
              `You rolled ${gameState.diceRolls.player}, AI rolled ${gameState.diceRolls.ai}`
            }
          </div>
          <Button
            onClick={checkDiceRollsAndSetTurn}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIFirstTurnDiceRoll;
