import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";
import { sendTransaction } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { Keypair } from "@solana/web3.js";
import { BadgesCondition } from "@honeycomb-protocol/edge-client";

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

// Create admin keypair from environment variable
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as string;
const adminKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(ADMIN_PRIVATE_KEY))
);

export async function POST(request: NextRequest) {
  try {
    const { profileAddress, criteriaIndex, userAddress } = await request.json();

    console.log(profileAddress, criteriaIndex, userAddress)

    if (!profileAddress) {
      return NextResponse.json(
        { error: "Profile address is required" },
        { status: 400 }
      );
    }

    if (criteriaIndex === undefined || criteriaIndex < 0) {
      return NextResponse.json(
        { error: "Valid criteria index is required" },
        { status: 400 }
      );
    }

    if (!userAddress) {
        return NextResponse.json(
          { error: "Valid wallet address is required" },
          { status: 400 }
        );
      }

    if (!PROJECT_ADDRESS) {
      return NextResponse.json(
        { error: "Project address not set" },
        { status: 500 }
      );
    }

    const { createClaimBadgeCriteriaTransaction: txResponse } =
      await client.createClaimBadgeCriteriaTransaction({
        args: {
          profileAddress: profileAddress,
          projectAddress: PROJECT_ADDRESS,
          proof: BadgesCondition.Public,
          payer: userAddress,
          criteriaIndex: criteriaIndex,
        },
      });

    const response = await sendTransaction(
      client,
      txResponse,
      [adminKeypair]
    );

    console.log("Claim badge response:", response);

    return NextResponse.json({
      success: true,
      transactionResult: response,
      profileAddress: profileAddress,
      criteriaIndex: criteriaIndex,
    });

  } catch (error) {
    console.error("Claim badge error:", error);
    return NextResponse.json(
      { error: `Something went wrong during badge claiming: ${error}` },
      { status: 500 }
    );
  }
}
