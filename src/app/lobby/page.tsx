"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { client } from "@/utils/constants/client";
import { characterAdressess } from "@/lib/charater-address";
import { CHARACTERS, Character } from "@/lib/characters";
import CharacterCarousel from "./features/CharacterCarousel";

type PartialCharacter = {
  source?: {
    params?: {
      attributes?: Record<string, string>;
    };
  };
};

export default function Lobby() {
  const wallet = useWallet();
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
          return CHARACTERS.find((char) => char.id === id);
        })
        .filter((c): c is Character => Boolean(c)); // Remove undefined values

      setCharacterAbilities(matchedAbilities);
    } catch (error) {
      console.error("Error fetching characters:", error);
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
        <h1 className="font-bold text-2xl -mt-4 mb-1">
          You're now Combat Ready!
        </h1>
      </div>

      <CharacterCarousel characters={characterAbilities} />
    </div>
  );
}
