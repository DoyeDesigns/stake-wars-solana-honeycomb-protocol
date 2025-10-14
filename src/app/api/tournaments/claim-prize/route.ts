import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;

const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

interface ClaimPrizeRequest {
  tournamentId: string;
  playerAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaimPrizeRequest = await request.json();
    const { tournamentId, playerAddress } = body;

    console.log("Claim prize request:", { tournamentId, playerAddress });

    if (!tournamentId || !playerAddress) {
      return NextResponse.json(
        { error: "Missing required fields: tournamentId, playerAddress" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY || !CHAKRA_RESOURCE_ADDRESS || !ADMIN_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Server configuration missing" },
        { status: 500 }
      );
    }

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);

    if (!tournamentSnap.exists()) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tournament = { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;

    // Verify tournament is completed
    if (tournament.status !== 'completed') {
      return NextResponse.json(
        { error: "Tournament is not completed yet" },
        { status: 400 }
      );
    }

    if (!tournament.prizeDistribution || tournament.prizeDistribution.length === 0) {
      return NextResponse.json(
        { error: "Prize distribution not available" },
        { status: 400 }
      );
    }

    // Find player's prize
    const playerPrize = tournament.prizeDistribution.find(
      (p: { address: string; amount: number; position: string; claimed?: boolean }) => 
        p.address === playerAddress
    );

    if (!playerPrize) {
      return NextResponse.json(
        { error: "You did not place in this tournament" },
        { status: 400 }
      );
    }

    // Check if already claimed
    if (playerPrize.claimed) {
      return NextResponse.json(
        { error: "Prize already claimed" },
        { status: 400 }
      );
    }

    if (playerPrize.amount <= 0) {
      return NextResponse.json(
        { error: "Prize amount is 0" },
        { status: 400 }
      );
    }

    console.log(`💰 Processing prize claim: ${playerPrize.amount} CKRA for ${playerAddress}`);

    // Create transfer transaction from PROJECT_AUTHORITY to player
    const { createTransferResourceTransaction: txResponse } = 
      await client.createTransferResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: PROJECT_AUTHORITY, // Authority owns the treasury
        recipient: playerAddress,
        amount: playerPrize.amount.toString(),
        payer: PROJECT_AUTHORITY, // Authority pays for transaction
      });

    // Sign and send transaction with admin keypair
    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    console.log("Prize transfer response:", response);

    if (response.status !== 'Success') {
      throw new Error("Prize transfer transaction failed");
    }

    // Mark prize as claimed in the tournament
    const updatedDistribution = tournament.prizeDistribution.map(
      (p: { address: string; amount: number; position: string; claimed?: boolean; transactionSignature?: string }) => {
        if (p.address === playerAddress) {
          return {
            ...p,
            claimed: true,
            claimedAt: Date.now(),
            transactionSignature: response.signature,
          };
        }
        return p;
      }
    );

    await updateDoc(tournamentRef, {
      prizeDistribution: updatedDistribution,
    });

    console.log(`✅ Prize claimed successfully: ${playerPrize.amount} CKRA sent to ${playerAddress}`);

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${playerPrize.amount} CKRA`,
      prize: {
        amount: playerPrize.amount,
        position: playerPrize.position,
        transactionSignature: response.signature,
      },
    });

  } catch (error) {
    console.error("Claim prize error:", error);
    return NextResponse.json(
      { error: `Failed to claim prize: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


