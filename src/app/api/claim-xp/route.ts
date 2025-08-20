import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";

// Create admin keypair from environment variable
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;
const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

export async function POST(request: NextRequest) {
  try {
    const { profileAddress, xpAmount } = await request.json();

    if (!profileAddress) {
      return NextResponse.json(
        { error: "Profile address is required" },
        { status: 400 }
      );
    }

    if (!xpAmount || xpAmount <= 0) {
      return NextResponse.json(
        { error: "Valid XP amount is required" },
        { status: 400 }
      );
    }

    const { createUpdatePlatformDataTransaction: txResponse } = await client.createUpdatePlatformDataTransaction({
      profile: profileAddress,
      authority: adminKeypair.publicKey.toString(),
      platformData: {
        addXp: xpAmount.toString(),
      },
    });

    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    return NextResponse.json({
      success: true,
      transactionResult: response,
      xpAmount: xpAmount,
    });

  } catch (error) {
    console.error("Claim XP error:", error);
    return NextResponse.json(
      { error: `Something went wrong during XP claim: ${error}` },
      { status: 500 }
    );
  }
}
