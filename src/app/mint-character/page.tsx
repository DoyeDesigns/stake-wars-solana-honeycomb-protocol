"use client";

import CircleCarousel from "@/components/CircleCarousel";
import ImageSlider from "@/components/ImageSlider";
import { client } from "@/utils/constants/client";
import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Character, CHARACTERS } from "@/lib/characters";
import { Character as CharacterType } from "@honeycomb-protocol/edge-client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { characterAdressess } from "@/lib/charater-address";

const ASSEMBLER_CONFIG_ADDRESS = process.env.ASSEMBLER_CONFIG_ADDRESS as string;
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

const traitUri =
  "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg";

export default function MintCharacter() {
  const wallet = useWallet();

  const [isMinting, setIsMinting] = useState(false);
  const [characterLengthBeforeMint, setCharacterLengthBeforeMint] = useState<
    number | null
  >();
  const [characterLengthAfterMint, setCharacterLengthAfterMint] = useState<
    number | null
  >();
  const [newCharacter, setNewCharacter] = useState<CharacterType | null>(null);
  const [characterAbility, setCharacterAbility] = useState<Character | null>(
    null
  );
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [newCharacterModelAddress, setNewCharacterModelAddress] = useState<string | null>(null);
  const router = useRouter();

  const villages = [
    "Hidden Leaf",
    "Hidden Sand",
    "Hidden Mist",
    "Hidden Cloud",
  ];
  // const weapons = ["Kunai", "Shuriken", "Sword", "Scythe"];
  const chakras = ["Fire", "Water", "Wind", "Earth", "Lightning"];

  useEffect(() => {
    const fetchCharacters = async () => {
      const characters = await findCharacters();
      setCharacterLengthBeforeMint(characters.length);
    };

    fetchCharacters();
  }, []);

  useEffect(() => {
    if (characterId) {
      try {
        const matched = CHARACTERS.find((char) => char.id === characterId);
        if (matched) {
          setCharacterAbility(matched);
          console.log(matched);
        }
      } catch (error) {
        console.error("Error matching character ability:", error);
      }
    }
  }, [characterId]);

  function getCharacterId(attributes: Record<string, string>) {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  const findCharacters = async (): Promise<CharacterType[]> => {
    try {
      if (!wallet.publicKey) {
        alert("Wallet not connected!");
        return [];
      }

      if (newCharacterModelAddress === null) {
        return []
      }

      const result = await client
        .findCharacters({
          trees: [newCharacterModelAddress as string],
        })
        .then(({ character }) => character);

      return result;
    } catch (error) {
      console.error("Error finding characters:", error);
      return [];
    }
  };

  const mintCharacter = async () => {
  setIsMinting(true);

  try {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    if (!PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
      alert("Project or assembler config address not set!");
      return;
    }

    // 1. Generate traits
    const generated = generateOrderedCharacterTraits().map(
      (trait) => [trait.label, trait.name] as [string, string]
    );

    // 2. Convert to object for ID extraction
    const attributesObject: Record<string, string> = Object.fromEntries(generated);
    const id = getCharacterId(attributesObject);
    setCharacterId(id); // Will trigger useEffect for characterAbility

    // 3. Find address from characterAddresses
    const matchedCharacter = characterAdressess.find((char) => char.id === id);

    if (!matchedCharacter) {
      toast.error("Character address not found for ID: " + id);
      return;
    }

    const characterModelAddress = matchedCharacter.address;
    setNewCharacterModelAddress(matchedCharacter.treeAdress)

    // 4. Minting
    const { createAssembleCharacterTransaction: txResponse } =
      await client.createAssembleCharacterTransaction({
        project: PROJECT_ADDRESS,
        assemblerConfig: ASSEMBLER_CONFIG_ADDRESS,
        authority: wallet.publicKey.toString(),
        characterModel: characterModelAddress,
        owner: wallet.publicKey.toBase58(),
        payer: wallet.publicKey.toString(),
        attributes: generated,
      });

    const response = await sendClientTransactions(client, wallet, txResponse);

    if (response[0].responses[0].status === "Success") {
      toast.success(response[0].responses[0].signature);

      const characters = await findCharacters();
      setCharacterLengthAfterMint(characters.length);

      console.log(characters)

      const lastCharacter = characters[characters.length - 1];
      setNewCharacter(lastCharacter);
    } else {
      toast.error("Minting failed. Please try again.");
    }
  } catch (error) {
    console.error("Minting error:", error);
    toast.error("Something went wrong during minting.");
  } finally {
    setIsMinting(false);
  }
};

  

  function generateOrderedCharacterTraits() {
    const shuffledVillages = [...villages]
      .sort(() => 0.5 - Math.random())
      .slice(0, 1);
      
    const shuffledChakras = [...chakras]
      .sort(() => 0.5 - Math.random())
      .slice(0, 1);

    const villageTrait = {
      label: "Village",
      name: shuffledVillages[0],
      uri: traitUri,
    };

    const chakraTrait = {
      label: "Chakra",
      name: shuffledChakras[0],
      uri: traitUri,
    };

    return [villageTrait, chakraTrait];
  }

  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img
          src="/stake-wars-logo.png"
          alt="stake wars logo"
          className="size-[206px] hidden sm:block"
        />
        <h1 className="font-bold text-2xl -mt-4 mb-1">Mint your Character</h1>
      </div>

      {(characterLengthAfterMint ?? 0) > (characterLengthBeforeMint ?? 0) &&
  newCharacter ? (
  <div className="flex flex-col gap-5 justify-center items-center mt-[65px] pb-10">
    <div className="bg-[#313030] px-8 flex items-center rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
      <div className="w-[135px] h-50 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {characterAbility && (
            <motion.div
              key={characterAbility.id}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full"
            >
              <img
                src={`/characters/${characterAbility.id}.png`}
                alt={characterAbility.id}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-full ml-5">
            <h1 className="font-extrabold text-[21px] text-white mb-6.5 mt-7.5">{characterAbility?.nickname}</h1>
            <p className="text-xs mb-3"><span className="font-extrabold">Village : </span> {characterAbility?.village}</p>
            <p className="text-xs"><span className="font-extrabold">Specialty : </span> {characterAbility?.specialty}</p>
        </div>
    </div>
    <Button
      className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
      onClick={() => router.push('/lobby')}
    >
      Go to lobby
    </Button>
  </div>
) : (
  <div className="flex flex-col justify-center items-center mt-[65px] pb-10">
    <div className="bg-[#313030] px-8 flex items-center justify-between rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
      <ImageSlider />
      <CircleCarousel />
    </div>
    <Button
      className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
      disabled={isMinting}
      onClick={() => mintCharacter()}
    >
      Mint Character
    </Button>
  </div>
)}
    </div>
  );
}
