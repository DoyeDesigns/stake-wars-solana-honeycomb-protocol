'use client'

import React, { useState } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { GameRoomDocument } from '@/store/useOnlineGame';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { compactHash } from './ConnectButton';
import { Label } from './ui/label';
import { Dispatch, SetStateAction } from "react";

interface GameRoomSearchProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const GameRoomSearch = ({setIsOpen} : GameRoomSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gameRoom, setGameRoom] = useState<GameRoomDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a valid Game Room ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roomRef = doc(collection(db, 'gameRooms'), searchQuery);
      const roomSnapshot = await getDoc(roomRef);

      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.data() as GameRoomDocument;
        setGameRoom({
          ...roomData,
          id: roomSnapshot.id
        });
      } else {
        setError('No game room found with this ID');
        setGameRoom(null);
      }
    } catch (err) {
      setError(`Error searching for game room. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!gameRoom) return;
      router.push(`/lobby?gid=${gameRoom.id}`);
      setIsOpen(false);
  };

  return (
    <div className="w-full space-y-4 mb-5 pt-3">
      <div className="flex flex-col">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}>
        <Label htmlFor='gameRoomid' className="flex relative items-center gap-2 mb-4">
      <img src='/search.png' alt='search'  className='absolute top-[30%] size-[18px] lg:size-[26px] ml-3 lg:ml-6'/>
        <Input id='gameRoomid' className="border border-[#FFFFFF78] h-[48px] lg:h-[69px] text-left px-10 lg:text-center text-white bg-transparent rounded-[10px] lg:rounded-[14px]" onChange={(e) => setSearchQuery(e.target.value)} value={searchQuery} type="text" placeholder="Search for Game ID" />
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className='absolute top-[20%] lg:top-[18%] right-0 h-7 text-[10px] lg:text-[14px] lg:h-11 border-none rounded-[10px] w-fit connect-button-bg text-white mr-3 lg:mr-6'
        >
          {loading ? (<span className="text-white">Searching...</span>) : (<span className="text-white">Search</span>)}
        </Button>
      </Label>
        </form>
      </div>

      {error && (
        <div className=" text-white text-center !mb-4">
            <span>{error}</span>
        </div>
      )}

      {gameRoom && (
        <div 
          className={`bg-[#1D1D1D] border border-[#A2A2A2] text-white rounded-[10px]`}
        >
          <div className="p-5 h-fit">
            <h2 className="text-[14px] lg:text-[18px] text-[#B91770] text-center lg:text-left font-bold mb-4">Game Room Details</h2>
            <div className="grid lg:grid-cols-2 gap-2 text-[12px] lg:text-[14px]">
              <div className='flex justify-between gap-1 lg:justify-start'>
                <strong>Room ID:</strong><span className='text-[#BFE528] text-right lg:text-left'>{gameRoom.id}</span>
              </div>
              <div className='truncate flex justify-between gap-1 lg:justify-start'>
                <strong>Created By:</strong> <span className='text-[#BFE528] text-right lg:text-left'>{compactHash(gameRoom.createdBy)}</span>
              </div>
              <div className='flex gap-1 lg:justify-start'>
                <strong>Players:</strong> <span className='text-right lg:text-left font-bold'>{Object.keys(gameRoom.players).length}/2</span>
              </div>
              <div className='flex justify-between gap-1 lg:justify-start'>
                <strong>Status:</strong> <span 
                  className={`text-[#BFE528] text-right lg:text-left capitalize`}
                >
                  {gameRoom.status}
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end mt-4">
              <Button 
                onClick={handleJoinRoom}
                disabled={gameRoom.status !== 'character-select'}
                className="bg-[#34681C] text-[12px] lg:text-base cursor-pointer disabled:bg-[#34681C]/80 rounded-[10px] h-11 text-white font-bold border-none"
              >
                {gameRoom.status === 'waiting' || gameRoom.status === 'character-select' ? 'Join Room' : 'Room Unavailable'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoomSearch;