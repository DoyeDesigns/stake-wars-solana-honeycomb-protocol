import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { GameRoomDocument } from "@/store/useOnlineGame";
import useOnlineGameStore from "@/store/useOnlineGame";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { compactHash } from "./ConnectButton";
import { MoonLoader } from "react-spinners";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";

interface GameRoomSearchProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const UserGameRooms = ({setIsOpen} : GameRoomSearchProps) => {
  const [gameRooms, setGameRooms] = useState<GameRoomDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "waiting" | "inProgress" | "character-select" | "finished" | "claimed" | "unclaimed" | null
  >(null); // Default to null to show all with priority

  const { findUserRooms, validatePlayerInRoom } = useOnlineGameStore();
  const router = useRouter();
  const wallet = useWallet();

  const fetchUserGameRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const rooms = await findUserRooms(wallet.publicKey?.toString() as string);
      // Don't filter - show all rooms including finished
      setGameRooms(rooms || []);
    } catch (err) {
      setError(`Failed to load game rooms. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGameRooms();
  }, [wallet]);

  const handleJoinRoom = async (gameRoom: GameRoomDocument) => {
    try {
      validatePlayerInRoom(wallet.publicKey?.toString() as string, gameRoom)

      router.push(`/game-play/${gameRoom.id}`);
      setIsOpen(false)
    } catch (err) {
      setError(`Failed to join game room. ${err}`);
    }
  };

  const handleClaimRewards = async (gameRoom: GameRoomDocument) => {
    setClaimingRewards(gameRoom.id);
    try {
      // Navigate to game room where they can claim rewards
      router.push(`/game-play/${gameRoom.id}`);
      setIsOpen(false);
    } catch (err) {
      toast.error(`Failed to claim rewards: ${err}`);
    } finally {
      setClaimingRewards(null);
    }
  };

  const getWinnerStatus = (gameRoom: GameRoomDocument): string => {
    if (!gameRoom.gameState?.winner || gameRoom.status !== 'finished') return '';
    
    const winnerId = gameRoom.gameState.winner === 'player1' 
      ? gameRoom.gameState.player1.id 
      : gameRoom.gameState.player2.id;
    
    if (winnerId === wallet.publicKey?.toString()) {
      return 'You Won! 🎉';
    } else {
      return 'You Lost';
    }
  };

  const sortedGameRooms = () => {
    let filtered = [...gameRooms];
    
    // Filter by specific sort option
    if (sortBy === 'claimed') {
      filtered = gameRooms.filter((room) => room.status === 'finished' && room.rewardsClaimed === true);
    } else if (sortBy === 'unclaimed') {
      filtered = gameRooms.filter((room) => room.status === 'finished' && room.rewardsClaimed !== true);
    } else if (sortBy === 'waiting') {
      filtered = gameRooms.filter((room) => room.status === 'waiting');
    } else if (sortBy === 'inProgress') {
      filtered = gameRooms.filter((room) => room.status === 'inProgress' || room.gameState?.gameStatus === 'inProgress');
    } else if (sortBy === 'character-select') {
      filtered = gameRooms.filter((room) => room.status === 'character-select');
    } else if (sortBy === 'finished') {
      filtered = gameRooms.filter((room) => room.status === 'finished');
    }
    // else null = show all with priority sorting
    
    // Sort by priority and then by most recent
    return filtered.sort((a, b) => {
      // If showing all games (no specific filter), apply priority order
      if (!sortBy) {
        const getPriority = (room: GameRoomDocument): number => {
          if (room.status === 'inProgress') return 1;
          if (room.status === 'character-select') return 2;
          if (room.status === 'waiting') return 3;
          if (room.status === 'finished' && !room.rewardsClaimed) return 4; // Unclaimed
          if (room.status === 'finished' && room.rewardsClaimed) return 5; // Claimed
          return 6;
        };
        
        const priorityA = getPriority(a);
        const priorityB = getPriority(b);
        
        // If different priorities, sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      }
      
      // Within same priority (or when filtered), sort by most recent first
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt?.toMillis?.() || 0;
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  };

  // const getUsernameById = (
  //   players: { [address: string]: GameRoomPlayer },
  //   userId: string
  // ): string => {
  //   const player = players[userId];
  //   return player?.wallet || "Unknown User";
  // };

  return (
    <div className="w-full space-y-4 mt-10">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-bold">Your Game Rooms</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={fetchUserGameRooms}
          >
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3">
              Sort By
            </DropdownMenuTrigger>
            <DropdownMenuContent className="!bg-[#0A0A0A]">
              <DropdownMenuItem onClick={() => setSortBy(null)} defaultChecked>
                All Games (Priority)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("inProgress")}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("character-select")}>
                Character Select
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("waiting")}>
                Waiting
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("unclaimed")}>
                🎁 Unclaimed Rewards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("claimed")}>
                ✅ Claimed Rewards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("finished")}>
                All Finished
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-5">
          <MoonLoader color="white" size={30}/>
        </div>
      )}

      {error && (
        <div className="alert alert-error bg-[#919090]/80 text-white">
          <div className="flex items-center">
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && gameRooms.length === 0 && (
        <p className="text-white text-center my-2">No game rooms found</p>
      )}

      {sortedGameRooms().map((gameRoom, index) => (
        <div
        key={index}
          className={`bg-[#1D1D1D] border border-[#A2A2A2] text-white rounded-[10px]`}
        >
          <div className="p-5 h-fit">
            <h2 className="text-[14px] lg:text-[18px] text-[#B91770] text-center lg:text-left font-bold mb-4">
              Game Room Details
            </h2>
            <div className="grid lg:grid-cols-2 gap-2 text-[12px] lg:text-[14px]">
              <div className="flex justify-between gap-1 lg:justify-start">
                <strong>Room ID:</strong>
                <span className="text-[#BFE528] text-right lg:text-left truncate max-w-[150px] sm:max-w-none" title={gameRoom.id}>
                  {gameRoom.id.length > 20 
                    ? `${gameRoom.id.slice(0, 10)}...${gameRoom.id.slice(-6)}`
                    : gameRoom.id
                  }
                </span>
              </div>
              <div className="truncate flex justify-between gap-1 lg:justify-start">
                <strong>Created By:</strong>{" "}
                <span className="text-[#BFE528] text-right lg:text-left">
                  {compactHash(gameRoom.createdBy)}
                </span>
              </div>
              <div className="flex gap-1 lg:justify-start">
                <strong>Players:</strong>{" "}
                <span className="text-right lg:text-left font-bold">
                  {Object.keys(gameRoom.players).length}/2
                </span>
              </div>
              <div className="flex justify-between gap-1 lg:justify-start">
                <strong>Status:</strong>{" "}
                <span
                  className={`text-right lg:text-left capitalize ${
                    gameRoom.status === 'finished' 
                      ? (gameRoom.rewardsClaimed ? 'text-green-400' : 'text-yellow-400')
                      : 'text-[#BFE528]'
                  }`}
                >
                  {gameRoom.status}
                  {gameRoom.status === 'finished' && (
                    gameRoom.rewardsClaimed ? ' ✅' : ' 🎁'
                  )}
                </span>
              </div>
              {gameRoom.status === 'finished' && (
                <div className="flex justify-between gap-1 lg:justify-start">
                  <strong>Result:</strong>{" "}
                  <span className="text-right lg:text-left font-bold text-white">
                    {getWinnerStatus(gameRoom)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-center lg:justify-end mt-4 gap-2">
              {gameRoom.status === 'finished' && !gameRoom.rewardsClaimed ? (
                <Button
                  onClick={() => handleClaimRewards(gameRoom)}
                  disabled={claimingRewards === gameRoom.id}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-[12px] lg:text-base cursor-pointer rounded-[10px] h-11 text-white font-bold border-none"
                >
                  {claimingRewards === gameRoom.id ? "Loading..." : "🎁 Claim Rewards"}
                </Button>
              ) : gameRoom.status === 'finished' ? (
                <Button
                  onClick={() => handleJoinRoom(gameRoom)}
                  className="bg-gray-600 hover:bg-gray-700 text-[12px] lg:text-base cursor-pointer rounded-[10px] h-11 text-white font-bold border-none"
                >
                  View Game
                </Button>
              ) : (
                <Button
                  onClick={() => handleJoinRoom(gameRoom)}
                  className="bg-[#34681C] text-[12px] lg:text-base cursor-pointer disabled:bg-[#34681C]/80 rounded-[10px] h-11 text-white font-bold border-none"
                >
                  Join Room
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserGameRooms;
