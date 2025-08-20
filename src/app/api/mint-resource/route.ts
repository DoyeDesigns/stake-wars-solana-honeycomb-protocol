import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;
const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

export async function POST(request: NextRequest) {
  try {
    const { walletPublicKey, amount } = await request.json();

    if (!walletPublicKey) {
      return NextResponse.json(
        { error: "Wallet public key is required" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY || !CHAKRA_RESOURCE_ADDRESS) {
      return NextResponse.json(
        { error: "Project or resource tree address not set" },
        { status: 500 }
      );
    }

    const { createMintResourceTransaction: txResponse } =
      await client.createMintResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        authority: PROJECT_AUTHORITY,
        owner: walletPublicKey,
        payer: PROJECT_AUTHORITY,
        amount: amount,
      });

    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    console.log("Mint resource response:", response);

    return NextResponse.json({
      success: true,
      transactionResult: response,
      amount: amount,
      owner: walletPublicKey,
    });

  } catch (error) {
    console.error("Mint resource error:", error);
    return NextResponse.json(
      { error: `Something went wrong during resource minting: ${error}` },
      { status: 500 }
    );
  }
}
