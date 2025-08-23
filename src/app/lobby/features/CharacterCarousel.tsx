"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Character } from "@/lib/characters";
import { Button } from "@/components/ui/button";
import useOnlineGameStore from "@/store/useOnlineGame";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Missions from "@/components/Missions";

const CARD_WIDTH = 155;
const CARD_OFFSET = 60;
const MAX_VISIBILITY = 2;

interface CharacterCarouselProps {
  characters: Character[];
  onCharacterSelect?: (character: Character) => void;
  selectedCharacter?: Character | null;
  isAIGame?: boolean;
}

export default function CharacterCarousel({
  characters,
  onCharacterSelect,
  selectedCharacter: selectedCharacterProp,
  isAIGame = false,
}: CharacterCarouselProps) {
  const wallet = useWallet();
  const [active, setActive] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { createOnlineGameRoom, joinGameRoom, selectCharacters } =
    useOnlineGameStore();
  const [roomToJoinId, setRoomToJoinId] = useState<string | null>(null);
  const [localSelectedCharacter, setLocalSelectedCharacter] = useState<Character | null>(null); 
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const gid = searchParams.get("gid");
    if (gid) {
      setRoomToJoinId(gid);
    }
  }, [searchParams]);

  const activeCharacter = characters[active];

  const selectedCharacter = isAIGame ? selectedCharacterProp : localSelectedCharacter;

  const handleCharacterSelect = () => {
    if (onCharacterSelect && isAIGame) {
      onCharacterSelect(activeCharacter);
    } else {
      setLocalSelectedCharacter(activeCharacter);
    }
  };

  const createGame = async () => {
    if (!wallet.connected) {
      toast.error("Wallet not connected. Connect wallet.");
      return;
    }
    if (!selectedCharacter) {
      toast.error("Please select a character first.");
      return;
    }

    setIsCreating(true);
    try {
      const roomId = await createOnlineGameRoom(
        wallet.publicKey?.toString() as string
      );

      if (!roomId) {
        throw new Error("Failed to create game room.");
      }

      selectCharacters(
        roomId,
        activeCharacter,
        wallet.publicKey?.toString() as string
      );
      await joinGameRoom(roomId, wallet.publicKey?.toString() as string);

      router.push(`/game-play/${roomId}`);

      toast.success("Game room created and joined successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Caught error ${error.message}`);
      } else {
        toast.error(`Caught error ${error}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = async () => {
    if (!wallet.connected) {
      toast.error("Wallet not connected. Connect wallet.");
      return;
    }
    if (!selectedCharacter) {
      toast.error("Please select a character first.");
      return;
    }

    setIsJoining(true);
    try {
      if (!roomToJoinId) {
        throw new Error("Failed to join game room.");
      }

      selectCharacters(
        roomToJoinId,
        activeCharacter,
        wallet.publicKey?.toString() as string
      );
      await joinGameRoom(roomToJoinId, wallet.publicKey?.toString() as string);

      router.push(`/game-play/${roomToJoinId}`);

      toast.success("Game room joined successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Caught error ${error.message}` ||
            "Something went wrong while joining the game."
        );
      } else {
        toast.error(`"Unknown error ${error}`);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % characters.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <h1 className="font-medium text-lg px-2 md:text-2xl text-center -mt-4 mb-1">
          {roomToJoinId ? (
            <span>
              Join <span className="font-semibold">{roomToJoinId}</span> Game to
              Battle. Select your character and join the game
            </span>
          ) : (
            "You're now Combat Ready! Select your character"
          )}
        </h1>
      </div>

      <div className="flex flex-col gap-5 justify-center items-center">
        <div className="relative w-fit flex justify-center items-center mt-8 overflow-hidden">
          <div className="md:block absolute left-0 z-50">
            <button onClick={handlePrev}>
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          </div>
          <div className="md:block absolute right-0 z-50">
            <button onClick={handleNext}>
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* Carousel */}
          <div className="relative w-[250px] h-[250px] sm:w-[260px] sm:h-[240px] flex justify-center items-center">
            {characters.map((character, i) => {
              const offset = i - active;
              const distance =
                offset > characters.length / 2
                  ? offset - characters.length
                  : offset < -characters.length / 2
                  ? offset + characters.length
                  : offset;

              const isActive = distance === 0;

              if (Math.abs(distance) > MAX_VISIBILITY) return null;

              return (
                <div
                  key={i}
                  className="border-4 border-black rounded-md overflow-hidden"
                >
                  <motion.div
                    className={`absolute top-0 left-1/2 transform -translate-x-1/2 rounded-xl ${
                      isActive ? "z-30" : "z-20"
                    }`}
                    style={{
                      width: `${CARD_WIDTH}px`,
                      scale: isActive ? 1 : 0.8,
                      opacity: isActive ? 1 : 0.4,
                      x: distance * CARD_OFFSET,
                      filter: isActive ? "none" : "blur(4px)",
                    }}
                    animate={{
                      x: distance * CARD_OFFSET,
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive ? 1 : 0.4,
                      filter: isActive ? "blur(0px)" : "blur(4px)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <img
                      src={`/characters/${character.id}.png`}
                      alt={character.nickname}
                      className="rounded-xl w-full h-full object-contain"
                    />
                    {selectedCharacter?.id === character.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          SELECTED
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center pb-5">
          <Button
            className="connect-button-bg h-10.5 w-[160px] border border-[#FFFFFF] rounded-lg"
            onClick={handleCharacterSelect}
          >
            Select Character
          </Button>

          <div className="flex items-center gap-5 pb-12 sm:pb-5">
            {!isAIGame && <Missions character={selectedCharacter as Character} />}

            {isAIGame ? null : (
              <>
                {roomToJoinId ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 rgba(255, 255, 255, 0)",
                        "0 0 20px rgba(255, 255, 255, 0.5)",
                        "0 0 0 rgba(255, 255, 255, 0)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Button
                      className="connect-button-bg h-10.5 w-[200px] border-2 border-[#FFD95E] rounded-lg font-bold text-lg"
                      onClick={joinGame}
                      disabled={isJoining || !selectedCharacter}
                    >
                      {isJoining ? "Joining..." : `Join Game`}
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    className="connect-button-bg h-10.2 w-[160px] border border-[#FFFFFF] rounded-lg"
                    onClick={createGame}
                    disabled={isCreating || !selectedCharacter}
                  >
                    {isCreating ? "Creating..." : "Create a game"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
