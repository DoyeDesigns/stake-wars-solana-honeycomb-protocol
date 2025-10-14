"use client";

import CircleCarousel from "@/components/CircleCarousel";
import ImageSlider from "@/components/ImageSlider";
import { client } from "@/utils/constants/client";
import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Character, CHARACTERS } from "@/lib/characters";
import { Character as CharacterType } from "@honeycomb-protocol/edge-client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { characterAdressess } from "@/lib/charater-address";
import { PartialCharacter } from "../lobby/page";

const CHAKRA_RESOURCE_TREE_ADDRESS = process.env
  .CHAKRA_RESOURCE_TREE_ADDRESS as string;

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
  const [newCharacterModelAddress, setNewCharacterModelAddress] = useState<
    string | null
  >(null);
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
  const router = useRouter();

  function getCharacterId(attributes: Record<string, string>) {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  useEffect(() => {
    const fetchCharacters = async () => {
      const characters = await findCharacters();
      setCharacterLengthBeforeMint(characters.length);
    };

    if (wallet.connected) {
      fetchCharacters();
      fetchResourcesBalance();
      fetchUserCharacters();
    } else {
      setCharacterLengthBeforeMint(null);
      setCharacterLengthAfterMint(null);
      setNewCharacter(null);
      setCharacterAbility(null);
      setCharacterId(null);
      setNewCharacterModelAddress(null);
      setChakraBalance(null);
      setCharacterAbilities([]);
    }
  }, [wallet.connected, wallet.disconnecting]);

  useEffect(() => {
    if (characterId) {
      try {
        const matched = CHARACTERS.find((char) => char.id === characterId);
        if (matched) {
          setCharacterAbility(matched);
        }
      } catch (error) {
        toast.error(`Error matching character ability ${error}`);
      }
    }
  }, [characterId]);



  const findCharacters = async (): Promise<CharacterType[]> => {
    try {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected!");
        return [];
      }

      if (newCharacterModelAddress === null) {
        return [];
      }

      const result = await client
        .findCharacters({
          trees: [newCharacterModelAddress as string],
          wallets: [wallet.publicKey?.toString() as string],
        })
        .then(({ character }) => character);

      return result;
    } catch (error) {
      toast.error(`Error finding characters ${error}`);
      return [];
    }
  };

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

  const mintCharacter = async () => {
    setIsMinting(true);

    try {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected!");
        return;
      }

      const mintResponse = await fetch("/api/mint-character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletPublicKey: wallet.publicKey.toString(),
          characterAddresses: characterAdressess,
        }),
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        toast.error(errorData.error || "Failed to create mint transaction");
        return;
      }

      const mintData = await mintResponse.json();
      
      setCharacterId(mintData.characterId);
      setNewCharacterModelAddress(mintData.treeAddress);

      if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
        toast.success("Character minted successfully!");

        const characters = await findCharacters();
        setCharacterLengthAfterMint(characters.length);

        const lastCharacter = characters[characters.length - 1];
        setNewCharacter(lastCharacter);
      } else {
        toast.error("Minting failed. Please try again.");
      }
    } catch (error) {
      toast.error(`Something went wrong during minting. ${error}`);
    } finally {
      setIsMinting(false);
    }
  };

  const fetchResourcesBalance = async () => {
    if (!wallet.connected) {
      toast.error("Please connect wallet to view resources balance.");
      return;
    }

    const resources = await client.findHoldings({
      holders: [wallet.publicKey?.toString() as string],
      trees: [CHAKRA_RESOURCE_TREE_ADDRESS],
    });
    setChakraBalance(Number(resources.holdings[0]?.balance));
  };




  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img
          src="/stake-wars-logo.png"
          alt="stake wars logo"
          className="size-[206px] hidden sm:block"
        />
        <h1 className="font-bold text-2xl -mt-4 mb-1">Mint your Character</h1>
        
        {/* Chakra Balance Display */}
        {wallet.connected && chakraBalance !== null && (
          <div className="flex items-center gap-2 mt-4 bg-[#313030] px-4 py-2 rounded-lg border border-[#E3DEDE]">
            <img src="/chakra_coin.svg" alt="chakra" width={20} height={20} />
            <span className="text-white font-bold">Balance: {chakraBalance} CHK</span>
          </div>
        )}
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
              <h1 className="font-extrabold text-[21px] text-white mb-6.5 mt-7.5">
                {characterAbility?.nickname}
              </h1>
              <p className="text-xs mb-3">
                <span className="font-extrabold">Village : </span>{" "}
                {characterAbility?.village}
              </p>
              <p className="text-xs">
                <span className="font-extrabold">Specialty : </span>{" "}
                {characterAbility?.specialty}
              </p>
            </div>
          </div>
          <Button
            className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
            onClick={() => router.push("/lobby")}
          >
            Go to lobby
          </Button>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-[65px]">
          {/* Existing Characters Section - Show if user already has a character */}
          {wallet.connected && characterAbilities.length > 0 ? (
            <div className="mb-8 w-full max-w-4xl px-4">
              {/* Warning Message */}
              <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-6 mb-6 text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-3">
                  ⚠️ Character Already Minted
                </h2>
                <p className="text-gray-300 text-lg mb-2">
                  You already have a character! Minting is only available for new players.
                </p>
                <p className="text-gray-400 text-sm">
                  Each player can only mint one character to maintain game balance.
                </p>
              </div>

              {/* Display Existing Character */}
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Your Character</h2>
              <div className="flex justify-center">
                <div className="bg-[#313030] p-6 rounded-xl border-2 border-purple-500/50 max-w-md w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden">
                      <img
                        src={`/characters/${characterAbilities[0].id}.png`}
                        alt={characterAbilities[0].nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xl">{characterAbilities[0].nickname}</h3>
                      <p className="text-sm text-purple-400">{characterAbilities[0].village}</p>
                      <p className="text-sm text-gray-300">{characterAbilities[0].specialty}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                    <p><span className="font-bold text-white">Health:</span> {characterAbilities[0].baseHealth}</p>
                    <p><span className="font-bold text-white">Abilities:</span> {characterAbilities[0].abilities.length}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button 
                  onClick={() => router.push('/lobby')} 
                  className="connect-button-bg cursor-pointer w-[200px] h-12 text-lg"
                >
                  Go to Lobby
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* New Players - Show Mint Interface */}
              <div className="mb-4">
                <div className="bg-green-900/30 border-2 border-green-500/50 rounded-xl p-4 text-center max-w-md">
                  <p className="text-green-400 font-semibold text-sm">
                    ✨ Welcome! You can mint your first character below.
                  </p>
                </div>
              </div>

              <div className="bg-[#313030] px-8 flex items-center justify-between rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
                <ImageSlider />
                <CircleCarousel />
              </div>
              <Button
                className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
                disabled={isMinting}
                onClick={() => mintCharacter()}
              >
                {isMinting ? "Minting..." : "Mint Character"}
              </Button>
              <Button 
                onClick={() => router.push('/lobby')} 
                className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-3 mb-10"
              >
                Lobby
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
