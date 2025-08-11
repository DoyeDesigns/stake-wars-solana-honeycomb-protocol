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
import { PartialCharacter } from "../lobby/page";

const ASSEMBLER_CONFIG_ADDRESS = process.env.ASSEMBLER_CONFIG_ADDRESS as string;
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;
const CHAKRA_RESOURCE_TREE_ADDRESS = process.env
  .CHAKRA_RESOURCE_TREE_ADDRESS as string;

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
  const [newCharacterModelAddress, setNewCharacterModelAddress] = useState<
    string | null
  >(null);
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
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
    fetchResourcesBalance();
    fetchUserCharacters();
  }, []);

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

  function getCharacterId(attributes: Record<string, string>) {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

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
        })
        .then(({ character }) => character);

      return result;
    } catch (error) {
      toast.error(`Error finding characters ${error}`);
      return [];
    }
  };

  const fetchUserCharacters = async () => {
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

  const mintCharacter = async () => {
    setIsMinting(true);

    try {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected!");
        return;
      }

      if (!PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
        toast.error("Project or assembler config address not set!");
        return;
      }

      const generated = generateOrderedCharacterTraits().map(
        (trait) => [trait.label, trait.name] as [string, string]
      );

      const attributesObject: Record<string, string> =
        Object.fromEntries(generated);
      const id = getCharacterId(attributesObject);
      setCharacterId(id);

      const matchedCharacter = characterAdressess.find(
        (char) => char.id === id
      );

      if (!matchedCharacter) {
        toast.error("Character address not found for ID: " + id);
        return;
      }

      const characterModelAddress = matchedCharacter.address;
      setNewCharacterModelAddress(matchedCharacter.treeAdress);

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
          <div className="bg-[#313030] px-8 flex items-center justify-between rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
            <ImageSlider />
            <CircleCarousel />
          </div>
          {characterAbilities.length > 3 ? (
            <Button
              disabled={(chakraBalance ?? 0) < 5000}
              className="connect-button-bg cursor-pointer w-fit h-10.5 mt-20"
            >
              Buy Character 5000 CHK
            </Button>
          ) : (
            <Button
              className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
              disabled={isMinting}
              onClick={() => mintCharacter()}
            >
              Mint Character
            </Button>
          )}
          <Button onClick={() => router.push('/lobby')} className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-3 mb-10">lobby</Button>
        </div>
      )}
    </div>
  );
}
