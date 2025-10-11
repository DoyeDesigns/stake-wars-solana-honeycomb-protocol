import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Connection } from "@solana/web3.js";
import { JoinWagerRequest, WagerGame } from "@/types/wager";
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
    const body: JoinWagerRequest = await request.json();
    const { wagerId, challengerAddress, characterId, characterAddress, transactionSignature } = body;

    console.log("Join wager request:", { wagerId, challengerAddress, characterId, characterAddress, transactionSignature });

    // Validation
    if (!wagerId || !challengerAddress || !characterId || !characterAddress || !transactionSignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY) {
      return NextResponse.json(
        { error: "Project authority not configured" },
        { status: 500 }
      );
    }

    // Get wager game
    const wagerRef = doc(db, 'wagerGames', wagerId);
    const wagerSnap = await getDoc(wagerRef);

    if (!wagerSnap.exists()) {
      return NextResponse.json(
        { error: "Wager game not found" },
        { status: 404 }
      );
    }

    const wagerGame = wagerSnap.data() as WagerGame;

    // Check wager status
    if (wagerGame.status !== 'open') {
      return NextResponse.json(
        { error: "Wager game is not open" },
        { status: 400 }
      );
    }

    // Check if challenger is same as creator
    if (wagerGame.creatorAddress === challengerAddress) {
      return NextResponse.json(
        { error: "Cannot join your own wager game" },
        { status: 400 }
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

    // Update wager game
    await updateDoc(wagerRef, {
      challengerAddress,
      challengerCharacterId: characterId,
      challengerCharacterAddress: characterAddress,
      challengerPaymentSignature: transactionSignature,
      status: 'in_progress',
      startedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined wager game",
      wagerId,
    });

  } catch (error) {
    console.error("Join wager error:", error);
    return NextResponse.json(
      { error: `Failed to join wager game: ${error}` },
      { status: 500 }
    );
  }
}

