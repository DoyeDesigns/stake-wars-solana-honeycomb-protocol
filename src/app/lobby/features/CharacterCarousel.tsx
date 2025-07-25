"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Character } from "@/lib/characters";
import { Button } from "@/components/ui/button";
import useOnlineGameStore from "@/store/online-game-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

const CARD_WIDTH = 155;
const CARD_OFFSET = 60;
const MAX_VISIBILITY = 2;

interface CharacterCarouselProps {
  characters: Character[];
}

export default function CharacterCarousel({ characters }: CharacterCarouselProps) {
  const wallet = useWallet();
  const [active, setActive] = useState(0);
  // const [createdGameRoom, setCreatedGameRoom] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { createOnlineGameRoom, joinGameRoom, selectCharacters } = useOnlineGameStore();
  const [roomToJoinId, setRoomToJoinId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
  const gid = searchParams.get("gid");
  if (gid) {
    setRoomToJoinId(gid);
  }
}, [searchParams]);

  const activeCharacter = characters[active]; 

  const createGame = async () => {
    if (!wallet.connected) {
      toast.error("Wallet not connected. Connect wallet.");
      return;
    }

    setIsCreating(true);
    try {
      const roomId = await createOnlineGameRoom(wallet.publicKey?.toString() as string);

      if (!roomId) {
        throw new Error("Failed to create game room.");
      }

      // setCreatedGameRoom(roomId)

      selectCharacters(roomId, activeCharacter, wallet.publicKey?.toString() as string);
      await joinGameRoom(roomId, wallet.publicKey?.toString() as string);

      toast.success("Game room created and joined successfully!");
    } catch (error) {
      if (error instanceof Error) {
    console.error("Caught error:", error.message);
  } else {
    console.error("Unknown error:", error);
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

    setIsJoining(true);
    try {
      if (!roomToJoinId) {
        throw new Error("Failed to join game room.");
      }

      selectCharacters(roomToJoinId, activeCharacter, wallet.publicKey?.toString() as string);
      await joinGameRoom(roomToJoinId, wallet.publicKey?.toString() as string);

      toast.success("Game room joined successfully!");
    } catch (error) {
      if (error instanceof Error) {
    console.error("Caught error:", error.message || "Something went wrong while joining the game.");
  } else {
    console.error("Unknown error:", error);
  }
    } finally {
      setIsCreating(false);
    }
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % characters.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center">
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
              <div key={character.id} className="border-4 border-black rounded-md overflow-hidden">
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
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-3 pb-10">
        <Button
          className="bg-black text-white h-10.2 w-50 border border-[#6B6969] rounded-lg"
          onClick={() => toast.info("Mission started")}
        >
          Go on a mission
        </Button>

        {roomToJoinId ? ( <Button
          className="connect-button-bg h-10.2 w-[140px] border border-[#FFFFFF] rounded-lg"
          onClick={joinGame}
          disabled={isJoining}
        >
          {isCreating ? "Creating..." : "Create a game"}
        </Button>) : (<Button
          className="connect-button-bg h-10.2 w-[140px] border border-[#FFFFFF] rounded-lg"
          onClick={createGame}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create a game"}
        </Button>)}
      </div>
    </div>
  );
}
