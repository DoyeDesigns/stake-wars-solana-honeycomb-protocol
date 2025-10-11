import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Connection } from "@solana/web3.js";
import { CreateWagerRequest, WagerGame } from "@/types/wager";
import { CHARACTERS } from "@/lib/characters";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://rpc.test.honeycombprotocol.com";

async function verifyTransaction(
  signature: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    
    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: "Transaction not found" };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: "Transaction failed" };
    }

    // Verify the transaction is confirmed
    const status = await connection.getSignatureStatus(signature);
    if (!status.value?.confirmationStatus || status.value.confirmationStatus === 'processed') {
      return { verified: false, error: "Transaction not confirmed yet" };
    }

    console.log("Transaction verified successfully:", signature);
    return { verified: true };

  } catch (error) {
    console.error("Transaction verification error:", error);
    return { verified: false, error: `Verification failed: ${error}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateWagerRequest = await request.json();
    const { creatorAddress, characterId, characterAddress, wagerAmount, transactionSignature } = body;

    console.log("Create wager request:", { creatorAddress, characterId, characterAddress, wagerAmount, transactionSignature });

    // Validation
    if (!creatorAddress || !characterId || !characterAddress || !wagerAmount || !transactionSignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (wagerAmount <= 0) {
      return NextResponse.json(
        { error: "Wager amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY) {
      return NextResponse.json(
        { error: "Project authority not configured" },
        { status: 500 }
      );
    }

    // Get character details
    const character = CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Invalid character" },
        { status: 400 }
      );
    }

    // Skip verification for admin bypass (testing purposes)
    const isAdminBypass = transactionSignature.startsWith("admin-bypass-");
    
    if (!isAdminBypass) {
      // Verify transaction for regular users
      const verification = await verifyTransaction(transactionSignature);

      if (!verification.verified) {
        return NextResponse.json(
          { error: `Payment verification failed: ${verification.error}` },
          { status: 400 }
        );
      }
    } else {
      console.log("Admin bypass - skipping payment verification");
    }

    // Create wager game
    const wagerId = `wager_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const wagerGame: WagerGame = {
      id: wagerId,
      creatorAddress,
      creatorCharacterId: characterId,
      creatorCharacterAddress: characterAddress,
      wagerAmount,
      status: 'open',
      creatorPaymentSignature: transactionSignature,
      createdAt: Date.now(),
    };

    // Save to Firestore
    const wagerRef = doc(db, 'wagerGames', wagerId);
    await setDoc(wagerRef, wagerGame);

    console.log("✅ Wager game created successfully:", wagerId);
    console.log("Wager data:", wagerGame);

    return NextResponse.json({
      success: true,
      message: "Wager game created successfully",
      wagerGame,
    });

  } catch (error) {
    console.error("Create wager error:", error);
    return NextResponse.json(
      { error: `Failed to create wager game: ${error}` },
      { status: 500 }
    );
  }
}

