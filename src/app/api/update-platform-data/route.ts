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
    const { profileAddress, index } = await request.json();

    if (!profileAddress) {
      return NextResponse.json(
        { error: "Profile address is required" },
        { status: 400 }
      );
    }

    if (index === undefined || index < 0) {
      return NextResponse.json(
        { error: "Valid index is required" },
        { status: 400 }
      );
    }

    // Create the update platform data transaction
    const { createUpdatePlatformDataTransaction: txResponse } =
      await client.createUpdatePlatformDataTransaction({
        profile: profileAddress,
        authority: adminKeypair.publicKey.toString(), // Admin authority
        platformData: {
          addAchievements: [index],
          addXp: "100"
        },
      });

    // Sign the transaction on the server using admin keypair
    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    console.log("Update platform data response:", response);

    // Return the signed transaction result
    return NextResponse.json({
      success: true,
      transactionResult: response,
      profileAddress: profileAddress,
      index: index,
    });

  } catch (error) {
    console.error("Update platform data error:", error);
    return NextResponse.json(
      { error: `Something went wrong during platform data update: ${error}` },
      { status: 500 }
    );
  }
}
