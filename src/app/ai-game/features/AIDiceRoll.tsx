"use client";
import React, { useState } from "react";
import useAIGameStore from "@/store/useAIGame";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

const AIDiceRoll: React.FC = () => {
  const {
    rollAndRecordDice,
    gameState,
    performAttack,
    addDefenseToInventory,
  } = useAIGameStore();
  const [rollNumber, setRollNumber] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const isPlayerTurn = (() => {
    if (gameState?.gameStatus !== "inProgress") return false;
    return gameState.currentTurn === "player";
  })();

  const handleRollDice = async () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    try {
      const rolledDiceNumber = await rollAndRecordDice('player');
      setRollNumber(rolledDiceNumber);
      
      // This is during the actual game - handle ability selection
      const player = gameState.player;

      if (player?.character) {
        const abilities = player.character.abilities;
        if (rolledDiceNumber > 0 && rolledDiceNumber <= abilities.length) {
          const ability = abilities[rolledDiceNumber - 1];

                      if (ability.type === "defense") {
              if (ability.defenseType) {
                addDefenseToInventory('player', ability.defenseType);
                toast.info(`Added 1 ${ability.defenseType} to your inventory`);
                // Switch turn to AI after player defense
                setTimeout(() => {
                  useAIGameStore.getState().setCurrentTurn('ai');
                }, 1000);
              } else {
                toast.error(
                  `Defense type is undefined for the given ability: ${ability}`
                );
              }
                         } else {
               if (gameState.player.activeBuffs?.length) {
                 const totalExtraDamage = gameState.player.activeBuffs.reduce(
                   (sum, buff) => sum + buff.effect,
                   0
                 );

                 const newAbility = {
                   ...ability,
                   value: (ability?.value ?? 0) + totalExtraDamage,
                 };

                 performAttack('player', newAbility, true);

                 toast.info(
                   `You used buffs to add ${totalExtraDamage} extra damage!`
                 );
               } else {
                 performAttack('player', ability, false);
               }
             }
        }
      } else {
        toast.error("Player or player.character is undefined");
      }

      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error rolling dice: ${error.message}`);
      }
      setIsButtonDisabled(false);
    }
  };

  // Only show this component during the actual game
  if (gameState.gameStatus !== 'inProgress') {
    return null;
  }

  if (!isPlayerTurn) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-white text-lg font-semibold">
          AI is thinking...
        </div>
        <div className="text-white text-sm">
          {gameState.ai.character?.nickname || 'AI'} is making a move
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleRollDice}
        disabled={isButtonDisabled}
        className="bg-[#B91770] hover:bg-[#B91770]/80 text-white font-bold py-2 px-6 rounded-lg"
      >
        {isButtonDisabled ? "Rolling..." : "Roll Dice"}
      </Button>
      
      {rollNumber > 0 && (
        <div className="text-white text-sm">
          You rolled: {rollNumber}
        </div>
      )}
    </div>
  );
};

export default AIDiceRoll;
