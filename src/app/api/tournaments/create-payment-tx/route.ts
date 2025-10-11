import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
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
        { error: "Project or resource address not set" },
        { status: 500 }
      );
    }

    // Create transfer transaction - user signs and pays gas
    const { createTransferResourceTransaction: txResponse } =
      await client.createTransferResourceTransaction({
        resource: CHAKRA_RESOURCE_ADDRESS,
        owner: walletAddress,              // User's wallet (signs & pays)
        recipient: PROJECT_AUTHORITY,      // Where chakra goes  
        amount: amount.toString(),
        // No payer specified = owner pays gas fees (avoids merkle tree errors)
      });

    // Return transaction for user to sign
    return NextResponse.json({
      success: true,
      transaction: txResponse,
      amount: amount,
      from: walletAddress,
      to: PROJECT_AUTHORITY,
    });

  } catch (error) {
    console.error("Create payment transaction error:", error);
    return NextResponse.json(
      { error: `Failed to create transaction: ${error}` },
      { status: 500 }
    );
  }
}

