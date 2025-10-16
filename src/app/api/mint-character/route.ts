import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { Character } from "@/lib/characters";
import { Keypair } from "@solana/web3.js";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers";

const ASSEMBLER_CONFIG_ADDRESS = process.env.ASSEMBLER_CONFIG_ADDRESS as string;
const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;
const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;

const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_PRIVATE_KEY as string))
);

// Character pricing breakdown
const CHARACTER_PRICE = 1000;
const BURN_PERCENTAGE = 0.60; // 60%
const TREASURY_PERCENTAGE = 0.40; // 40%

const BURN_AMOUNT = Math.floor(CHARACTER_PRICE * BURN_PERCENTAGE); // 600 CHK
const TREASURY_AMOUNT = Math.floor(CHARACTER_PRICE * TREASURY_PERCENTAGE); // 400 CHK

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

/**
 * Mint character endpoint
 * Supports two modes:
 * 1. FREE MINT: No characterId = random character (for new users from /mint-character page)
 * 2. PAID MINT: With characterId = specific character (from marketplace purchase)
 */
export async function POST(request: NextRequest) {
  try {
    const { walletPublicKey, characterAddresses, characterId, isPurchase } = await request.json();

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
    let generated: [string, string][];
    
    if (characterId) {
      // If characterId is provided, parse it to get village and chakra
      // Format: "hidden_leaf-fire" -> ["Hidden Leaf", "Fire"]
      const parts = characterId.split('-');
      const village = parts[0].split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      const chakra = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      
      generated = [
        ["Village", village],
        ["Chakra", chakra]
      ];
    } else {
      // Random generation if no characterId provided
      generated = generateOrderedCharacterTraits().map(
        (trait) => [trait.label, trait.name] as [string, string]
      );
    }

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

    // PAID MINT: If this is a purchase from marketplace
    if (isPurchase === true) {
      if (!CHAKRA_RESOURCE_ADDRESS) {
        return NextResponse.json(
          { error: "CHAKRA_RESOURCE_ADDRESS not configured" },
          { status: 500 }
        );
      }

      console.log(`PAID MINT: Burn (${BURN_AMOUNT} CHK) + Mint Character (User already transferred ${TREASURY_AMOUNT} CHK to treasury)`);

      // 1. Burn 30 CHK (60%) - ADMIN SIGNS
      const { createBurnResourceTransaction: burnTxResponse } = await client.createBurnResourceTransaction({
        authority: PROJECT_AUTHORITY,
        resource: CHAKRA_RESOURCE_ADDRESS,
        amount: BURN_AMOUNT.toString(),
        payer: adminKeypair.publicKey.toString(),
        owner: walletPublicKey
      });

      console.log("Sending burn transaction (admin signed)...");
      const burnResponse = await sendTransaction(client, burnTxResponse, [adminKeypair]);
      
      if (burnResponse.status !== "Success") {
        throw new Error(`Burn transaction failed: ${burnResponse.error || 'Unknown error'}`);
      }

      // 2. Mint Character - ADMIN SIGNS
      const { createAssembleCharacterTransaction: mintTxResponse } =
        await client.createAssembleCharacterTransaction({
          project: PROJECT_ADDRESS,
          assemblerConfig: ASSEMBLER_CONFIG_ADDRESS,
          authority: PROJECT_AUTHORITY,
          characterModel: characterModelAddress,
          owner: walletPublicKey,
          payer: PROJECT_AUTHORITY,
          attributes: generated,
        });

      console.log("Sending mint transaction (admin signed)...");
      const mintResponse = await sendTransaction(client, mintTxResponse, [adminKeypair]);

      if (mintResponse.status !== "Success") {
        throw new Error(`Mint transaction failed: ${mintResponse.error || 'Unknown error'}`);
      }

      console.log("Burn + Mint completed successfully!");

      return NextResponse.json({
        success: true,
        transactionResult: mintResponse,
        characterId: id,
        characterModelAddress,
        treeAddress: matchedCharacter.treeAdress,
        attributes: generated,
        payment: {
          total: CHARACTER_PRICE,
          burnt: BURN_AMOUNT,
          treasury: TREASURY_AMOUNT,
        }
      });
    } 
    // FREE MINT: For new users from /mint-character page
    else {
      console.log("FREE MINT: Creating character for new user (no payment required)");

      // Mint Character - ADMIN SIGNS (no burn, no payment)
      const { createAssembleCharacterTransaction: mintTxResponse } =
        await client.createAssembleCharacterTransaction({
          project: PROJECT_ADDRESS,
          assemblerConfig: ASSEMBLER_CONFIG_ADDRESS,
          authority: PROJECT_AUTHORITY,
          characterModel: characterModelAddress,
          owner: walletPublicKey,
          payer: PROJECT_AUTHORITY,
          attributes: generated,
        });

      console.log("Sending free mint transaction (admin signed)...");
      const mintResponse = await sendTransaction(client, mintTxResponse, [adminKeypair]);

      if (mintResponse.status !== "Success") {
        throw new Error(`Mint transaction failed: ${mintResponse.error || 'Unknown error'}`);
      }

      console.log("Free mint completed successfully!");

      return NextResponse.json({
        success: true,
        transactionResult: mintResponse,
        characterId: id,
        characterModelAddress,
        treeAddress: matchedCharacter.treeAdress,
        attributes: generated,
        isFree: true,
      });
    }

  } catch (error) {
    console.error("Mint character error:", error);
    return NextResponse.json(
      { error: `Something went wrong during minting: ${error}` },
      { status: 500 }
    );
  }
}
