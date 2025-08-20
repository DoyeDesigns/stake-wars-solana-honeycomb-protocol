"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CHARACTERS, Character } from '@/lib/characters';
import CharacterCarousel from '../lobby/features/CharacterCarousel';
import { Button } from '@/components/ui/button';
import useAIGameStore from '@/store/useAIGame';
import AIGameplay from './features/AIGameplay';
import { client } from '@/utils/constants/client';
import { characterAdressess } from '@/lib/charater-address';

export type PartialCharacter = {
  address: string;
  source?: {
    params?: {
      attributes?: Record<string, string>;
    };
  };
};

export default function AIGame() {
  const wallet = useWallet();
  const router = useRouter();
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const {
    reset,
    selectPlayerCharacter, 
    selectAICharacter,
  } = useAIGameStore();

  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");

  function getCharacterId(attributes: Record<string, string>) {
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  const fetchUserCharacters = async () => {
    if (!wallet.publicKey) return;
    try {
      const treeAddresses = Array.from(
        new Set(characterAdressess.map((c) => c.treeAdress))
      );

      const { character } = await client.findCharacters({
        trees: treeAddresses,
        includeProof: true,
        wallets: [wallet.publicKey?.toString() as string],
      });

      const matchedAbilities = (character as PartialCharacter[])
        .map((c) => {
          const id = getCharacterId(c.source?.params?.attributes ?? {});
          const foundCharacter = CHARACTERS.find((char) => char.id === id);

          if (foundCharacter) {
            return {
              ...foundCharacter,
              address: c.address,
            };
          }
          return undefined;
        })
        .filter(Boolean) as Character[];

      setCharacterAbilities(matchedAbilities);
    } catch (error) {
      toast.error(`Error fetching characters ${error}`);
    }
  };

  useEffect(() => {
    if (wallet.connected) {
      fetchUserCharacters();
    }
  }, [wallet.connected]);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleStartGame = () => {
    if (!selectedCharacter || !wallet.publicKey) {
      toast.error('Please select a character and connect your wallet');
      return;
    }

    // Select player character
    selectPlayerCharacter(selectedCharacter, wallet.publicKey.toString());
    
    // Select random AI character (AI doesn't need an address)
    selectAICharacter();
    
    // Don't start the game yet - let the first turn dice roll handle it
    // startGame(wallet.publicKey.toString());
    
    setGameStarted(true);
  };

  const handleBackToLobby = () => {
    reset();
    setGameStarted(false);
    setSelectedCharacter(null);
    router.push('/lobby');
  };

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Connect Wallet to Play VS AI</h1>
        <p className="text-white mb-4">You need to connect your wallet to play against AI</p>
        <Button onClick={() => router.push('/')}>
          Go to Home
        </Button>
      </div>
    );
  }

  if (gameStarted) {
    return <AIGameplay />;
  }

  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img
          src="/stake-wars-logo.png"
          alt="stake wars logo"
          className="size-[206px] hidden sm:block"
        />
        <h1 className="font-bold text-2xl text-center -mt-4 mb-1">
          VS AI Mode
        </h1>
      </div>

      {characterAbilities.length > 0 ? (
        <div className="space-y-6">
          <CharacterCarousel 
            characters={characterAbilities} 
            onCharacterSelect={handleCharacterSelect}
            selectedCharacter={selectedCharacter}
            isAIGame={true}
          />
          
          <div className="flex justify-center gap-4 pb-20 sm:pb-10">
            <Button 
              onClick={handleBackToLobby}
              variant="outline"
              className="border-[#6B6969] text-white hover:bg-[#6B6969]"
            >
              Back to Lobby
            </Button>
            
            <Button 
              onClick={handleStartGame}
              disabled={!selectedCharacter}
              className="bg-[#B91770] hover:bg-[#B91770]/80 text-white"
            >
              Start VS AI Game
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full w-full">
          <Button 
            className="border-none connect-button-bg my-10 text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-fit h-[38px] rounded-[4px]" 
            onClick={() => router.push('/mint-character')}
          >
            Mint Character
          </Button>
        </div>
      )}
    </div>
  );
}
