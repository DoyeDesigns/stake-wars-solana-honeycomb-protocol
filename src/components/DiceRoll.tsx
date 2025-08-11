"use client";
import React, { useState } from "react";
import useOnlineGameStore, { UpdateData } from "@/store/online-game-store";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const DiceRoll: React.FC = () => {
  const {
    rollAndRecordDice,
    gameState,
    performAttack,
    roomId,
    addDefenseToInventory,
  } = useOnlineGameStore();
  const [rollNumber, setRollNumber] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const wallet = useWallet();

  const isPlayerTurn = (() => {
    if (gameState?.gameStatus !== "inProgress") return false;

    const isPlayer1 = gameState.player1?.id === wallet.publicKey?.toString();
    const isPlayer2 = gameState.player2?.id === wallet.publicKey?.toString();

    if (isPlayer1 && gameState.currentTurn === "player1") return true;
    if (isPlayer2 && gameState.currentTurn === "player2") return true;
    return false;
  })();

  const handleRollDice = async () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    try {
      const rolledDiceNumber = await rollAndRecordDice();
      const currentPlayer = gameState.currentTurn;
      const player = gameState[currentPlayer];

      if (player?.character) {
        const abilities = player.character.abilities;
        if (rolledDiceNumber > 0 && rolledDiceNumber <= abilities.length) {
          const ability = abilities[rolledDiceNumber - 1];

          if (ability.type === "defense") {
            if (ability.defenseType) {
              addDefenseToInventory(currentPlayer, ability.defenseType);
              toast.info(`Added 1 ${ability.defenseType} to your inventory`);
            } else {
              toast.error(
                `Defense type is undefined for the given ability: ${ability}`
              );
            }
          } else {
            if (gameState[currentPlayer].activeBuffs?.length) {
              const totalExtraDamage = gameState[currentPlayer].activeBuffs.reduce(
                (sum, buff) => sum + buff.effect,
                0
              );

            const newAbility = {
              ...ability,
              value: (ability?.value ?? 0) + totalExtraDamage,
            };

            performAttack(currentPlayer, newAbility);

              const updatedBuffs = gameState[currentPlayer].activeBuffs
                .map((buff) => ({
                  ...buff,
                  remainingTurns: buff.remainingTurns - 1,
                }))
                .filter((buff) => buff.remainingTurns > 0);

              const updateData: UpdateData = {
                [`gameState.${currentPlayer}.activeBuffs`]: updatedBuffs,
              };

              await updateDoc(doc(db, "gameRooms", roomId as string), updateData);

              toast.info(
                `${currentPlayer} used buffs to add ${totalExtraDamage} extra damage!`
              );
            } else {
              performAttack(currentPlayer, ability)
            }
          }
        }
      } else {
        toast.error("Player or player.character is undefined");
      }
      setRollNumber(rolledDiceNumber);

      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error rolling dice: ${error.message}`);
      }

      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 3000);
    }
  };

  return (
    <div>
      <Button
        disabled={!isPlayerTurn || isButtonDisabled}
        className={`bg-[#B91770] h-[40px] w-[230px] lg:w-[308px] cursor-pointer !rounded lg:h-[36px] text-black font-bold py-2 px-4 disabled:bg-accent/70 disabled:text-white`}
        onClick={handleRollDice}
      >
        <img src="/dice.png" alt="dice" className="size-[16px]" /> Roll Dice{" "}
        <span className="hidden">{rollNumber}</span>
      </Button>
    </div>
  );
};

export default DiceRoll;
