"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { client } from "@/utils/constants/client";
import { characterAdressess } from "@/lib/charater-address";
import { CHARACTERS, Character } from "@/lib/characters";
import CharacterCarousel from "./features/CharacterCarousel";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MoonLoader } from "react-spinners";

export type PartialCharacter = {
  address: string;
  source?: {
    params?: {
      attributes?: Record<string, string>;
    };
  };
};

export default function Lobby() {
  const wallet = useWallet();
  const router = useRouter();
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);

  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");

  function getCharacterId(attributes: Record<string, string>) {
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  const fetchCharacters = async () => {
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
    if (wallet.publicKey) {
      fetchCharacters();
    }
  }, [wallet.publicKey]);

  return (
    <div>
      <Suspense fallback={<div className="p-4"><MoonLoader size={30} /></div>}>
        {characterAbilities.length > 0 ? (
          <div className="space-y-10">
            {/* Quick Access Navigation */}
            <div className="flex flex-col items-center gap-4">
              {/* Primary Actions */}
              <div className="flex justify-center gap-4 flex-wrap">
                <Button 
                  onClick={() => router.push('/ai-game')}
                  className="bg-[#B91770] hover:bg-[#B91770]/80 text-white font-bold py-3 px-6 rounded-lg"
                >
                  🎮 VS AI Mode
                </Button>
                <Button 
                  onClick={() => router.push('/wager')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  💰 Wager Matches
                </Button>
                <Button 
                  onClick={() => router.push('/tournaments')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  🏆 Tournaments
                </Button>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex justify-center gap-3 flex-wrap">
                <Button 
                  onClick={() => router.push('/leaderboard')}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-2 px-5 rounded-lg text-sm"
                >
                  📊 Leaderboard
                </Button>
              </div>
            </div>
            
            <CharacterCarousel characters={characterAbilities} />
          </div>
        ) : (
          <div className="flex flex-col justify-center text-center px-2 gap-2 items-center h-full w-full">
            <p>You do not have a character, click the button to mint a character</p>
            <Button 
              className="border-none connect-button-bg my-10 text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-fit h-[38px] rounded-[4px]" 
              onClick={() => router.push('/mint-character')}
            >
              Mint Character
            </Button>
          </div>
        )}
      </Suspense>
    </div>
  );
}
