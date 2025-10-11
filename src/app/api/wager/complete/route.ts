import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Keypair } from "@solana/web3.js";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { CompleteWagerRequest, WagerGame } from "@/types/wager";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;
const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

export async function POST(request: NextRequest) {
  try {
    const body: CompleteWagerRequest = await request.json();
    const { wagerId, winnerId } = body;

    console.log("Complete wager request:", { wagerId, winnerId });

    // Validation
    if (!wagerId || !winnerId) {
      return NextResponse.json(
        { error: "Missing required fields: wagerId or winnerId" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY || !CHAKRA_RESOURCE_ADDRESS) {
      return NextResponse.json(
        { error: "Project authority or Chakra resource not configured" },
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
    if (wagerGame.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Wager game is not in progress. Status: ${wagerGame.status}` },
        { status: 400 }
      );
    }

    // Validate winner is one of the players
    if (winnerId !== wagerGame.creatorAddress && winnerId !== wagerGame.challengerAddress) {
      return NextResponse.json(
        { error: "Winner must be one of the players" },
        { status: 400 }
      );
    }

    // Check if both players have paid
    if (!wagerGame.creatorPaymentSignature || !wagerGame.challengerPaymentSignature) {
      return NextResponse.json(
        { error: "Both players must have paid before settling" },
        { status: 400 }
      );
    }

    // Calculate total prize (both players' wagers)
    const totalPrize = wagerGame.wagerAmount * 2;

    console.log(`Transferring ${totalPrize} CKRA from admin (${PROJECT_AUTHORITY}) to winner (${winnerId})`);

    // Check if this is an admin bypass transaction
    const isAdminBypass = wagerGame.creatorPaymentSignature.startsWith("admin-bypass-") && 
                          wagerGame.challengerPaymentSignature?.startsWith("admin-bypass-");

    let winnerPaymentSignature = "admin-bypass-payment-skipped";

    if (!isAdminBypass) {
      // Create transfer transaction from admin to winner
      const { createTransferResourceTransaction: txResponse } = await client.createTransferResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: PROJECT_AUTHORITY,
        recipient: winnerId,
        amount: totalPrize.toString(),
      });

      // Admin signs and sends the transaction
      const response = await sendTransaction(
        client,
        txResponse,
        [adminKeypair]
      );

      console.log("Winner payment transaction response:", response);

      // Verify transaction succeeded
      if (!response || response.status !== "Success") {
        throw new Error(`Payment transaction failed: ${response?.status || 'Unknown error'}`);
      }

      // Extract signature from admin-signed transaction (sendTransaction format)
      if (response.signature) {
        winnerPaymentSignature = response.signature;
        console.log("✅ Winner payment signature:", winnerPaymentSignature);
      } else {
        console.error("❌ No signature in response:", response);
        throw new Error("Failed to get payment signature from transaction response");
      }
    } else {
      console.log("Admin bypass - skipping actual payment");
    }

    // Update wager game with winner and payment info
    await updateDoc(wagerRef, {
      winnerId,
      winnerPaymentSignature,
      status: 'completed',
      completedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Wager settled successfully. Winner has been paid.",
      winnerId,
      totalPrize,
      winnerPaymentSignature,
    });

  } catch (error) {
    console.error("Complete wager error:", error);
    return NextResponse.json(
      { error: `Failed to complete wager game: ${error}` },
      { status: 500 }
    );
  }
}

