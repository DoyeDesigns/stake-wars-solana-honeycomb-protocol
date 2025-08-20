import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";
import { Character } from "@/lib/characters";

const ASSEMBLER_CONFIG_ADDRESS = process.env.ASSEMBLER_CONFIG_ADDRESS as string;
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;
const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;
const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

const traitUri =
  "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg";

const villages = [
  "Hidden Leaf",
  "Hidden Sand", 
  "Hidden Mist",
  "Hidden Cloud",
];

const chakras = ["Fire", "Water", "Wind", "Earth", "Lightning"];

function getCharacterId(attributes: Record<string, string>) {
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
  return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
}

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

export async function POST(request: NextRequest) {
  try {
    const { walletPublicKey, characterAddresses } = await request.json();

    if (!walletPublicKey) {
      return NextResponse.json(
        { error: "Wallet public key is required" },
        { status: 400 }
      );
    }

    if (!PROJECT_ADDRESS || !ASSEMBLER_CONFIG_ADDRESS) {
      return NextResponse.json(
        { error: "Project or assembler config address not set" },
        { status: 500 }
      );
    }

    // Generate character traits
    const generated = generateOrderedCharacterTraits().map(
      (trait) => [trait.label, trait.name] as [string, string]
    );

    const attributesObject: Record<string, string> = Object.fromEntries(generated);
    const id = getCharacterId(attributesObject);

    // Find the character address from the provided addresses
    const matchedCharacter = characterAddresses.find((char: Character) => char.id === id);

    if (!matchedCharacter) {
      return NextResponse.json(
        { error: `Character address not found for ID: ${id}` },
        { status: 404 }
      );
    }

    const characterModelAddress = matchedCharacter.address;

    const { createAssembleCharacterTransaction: txResponse } =
      await client.createAssembleCharacterTransaction({
        project: PROJECT_ADDRESS,
        assemblerConfig: ASSEMBLER_CONFIG_ADDRESS,
        authority: PROJECT_AUTHORITY,
        characterModel: characterModelAddress,
        owner: walletPublicKey,
        payer: PROJECT_AUTHORITY,
        attributes: generated,
      });

    const response = await sendTransaction(
        client,
        txResponse,
        [adminKeypair]
    );

    console.log(response)

    return NextResponse.json({
      success: true,
      transactionResult: response,
      characterId: id,
      characterModelAddress,
      treeAddress: matchedCharacter.treeAdress,
      attributes: generated,
    });

  } catch (error) {
    console.error("Mint character error:", error);
    return NextResponse.json(
      { error: `Something went wrong during minting: ${error}` },
      { status: 500 }
    );
  }
}
