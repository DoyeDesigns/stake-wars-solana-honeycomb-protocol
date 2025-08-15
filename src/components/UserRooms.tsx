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

interface GameRoomSearchProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const UserGameRooms = ({setIsOpen} : GameRoomSearchProps) => {
  const [gameRooms, setGameRooms] = useState<GameRoomDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<
    "waiting" | "inProgress" | "character-select" | null
  >('inProgress');

  const { joinGameRoom, findUserRooms } = useOnlineGameStore();
  const router = useRouter();
  const wallet = useWallet();

  const fetchUserGameRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const rooms = await findUserRooms(wallet.publicKey?.toString() as string);
      const filteredRooms = rooms?.filter(
        (room) =>
          room.status === "inProgress" ||
          room.status === "character-select" ||
          room.status === "waiting"
      );
      setGameRooms(filteredRooms || []);
    } catch (err) {
      setError(`Failed to load game rooms. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGameRooms();
  }, [wallet]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinGameRoom(roomId, wallet.publicKey?.toString() as string);
    } catch (err) {
      setError(`Failed to join game room. ${err}`);
    } finally {
      router.push(`/game-play/${roomId}`);
      setIsOpen(false)
    }
  };

  const sortedGameRooms = () => {
    if (!sortBy) return gameRooms;
    return [
      ...gameRooms.filter((room) => room?.gameState?.gameStatus === sortBy),
      ...gameRooms.filter((room) => room?.gameState?.gameStatus !== sortBy),
    ];
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
              <DropdownMenuItem onClick={() => setSortBy("waiting")}>
                Waiting
              </DropdownMenuItem>
              <DropdownMenuItem defaultChecked onClick={() => setSortBy("inProgress")}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("character-select")}>
                Character select
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy(null)}>
                Clear Sort
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
                <span className="text-[#BFE528] text-right lg:text-left">
                  {gameRoom.id}
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
                  className={`text-[#BFE528] text-right lg:text-left capitalize`}
                >
                  {gameRoom.status}
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end mt-4">
              <Button
                onClick={() => handleJoinRoom(gameRoom.id)}
                className="bg-[#34681C] text-[12px] lg:text-base cursor-pointer disabled:bg-[#34681C]/80 rounded-[10px] h-11 text-white font-bold border-none"
              >
                Join Room
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserGameRooms;
