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
    fetchCharacters();
  }, [wallet.connected]);

  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img
          src="/stake-wars-logo.png"
          alt="stake wars logo"
          className="size-[206px] hidden sm:block"
        />
        <h1 className="font-bold text-2xl text-center -mt-4 mb-1">
          You&apos;re now Combat Ready!
        </h1>
      </div>

      <Suspense fallback={<div>Loading carousel...</div>}>
        {characterAbilities.length > 0 ? (<CharacterCarousel characters={characterAbilities} />) : (<div className="flex justify-center items-center h-full w-full"><Button className="border-none connect-button-bg my-10 text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-fit h-[38px] rounded-[4px]" onClick={() => router.push('/lobby')}>Mint Character</Button></div>)}
      </Suspense>
    </div>
  );
}
