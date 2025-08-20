import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;

// Validate environment variables
if (!process.env.ADMIN_PRIVATE_KEY) {
  throw new Error("ADMIN_PRIVATE_KEY environment variable is not set");
}

if (!PROJECT_AUTHORITY) {
  throw new Error("PROJECT_AUTHORITY environment variable is not set");
}

if (!CHAKRA_RESOURCE_ADDRESS) {
  throw new Error("CHAKRA_RESOURCE_ADDRESS environment variable is not set");
}

const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_PRIVATE_KEY))
);

export async function POST(request: NextRequest) {
  try {
    const { amount, userPublicKey } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!userPublicKey) {
      return NextResponse.json(
        { error: "User public key is required" },
        { status: 400 }
      );
    }

    const { createBurnResourceTransaction: txResponse } = await client.createBurnResourceTransaction({
      authority: userPublicKey,
      resource: CHAKRA_RESOURCE_ADDRESS,
      amount: amount.toString(),
      payer: adminKeypair.publicKey.toString(),
    });

    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    return NextResponse.json({
      success: true,
      transactionResult: response,
      amount: amount,
    });

  } catch (error) {
    console.error("Burn resource error:", error);
    return NextResponse.json(
      { error: `Something went wrong during burning: ${error}` },
      { status: 500 }
    );
  }
}
