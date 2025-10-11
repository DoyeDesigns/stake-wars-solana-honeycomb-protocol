import { NextRequest, NextResponse } from "next/server";
import { client } from "@/utils/constants/client";

export async function POST(request: NextRequest) {
  try {
    const { profileAddress, payer, result, accessToken } = await request.json();

    if (!profileAddress || !payer || !result || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: profileAddress, payer, result, or accessToken" },
        { status: 400 }
      );
    }

    if (result !== "win" && result !== "loss") {
      return NextResponse.json(
        { error: "Result must be 'win' or 'loss'" },
        { status: 400 }
      );
    }

    // Fetch current profile to get existing stats
    const { profile } = await client.findProfiles({
      addresses: [profileAddress],
    });

    if (!profile || profile.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const currentProfile = profile[0];
    const currentWins = parseInt(currentProfile.customData?.wins?.[0] || "0");
    const currentLosses = parseInt(currentProfile.customData?.losses?.[0] || "0");

    // Increment the appropriate counter
    const newWins = result === "win" ? currentWins + 1 : currentWins;
    const newLosses = result === "loss" ? currentLosses + 1 : currentLosses;

    const {
      createUpdateProfileTransaction: txResponse,
    } = await client.createUpdateProfileTransaction(
      {
        payer: payer,
        profile: profileAddress,
        customData: {
          add: {
            wins: [newWins.toString()],
            losses: [newLosses.toString()],
          },
        },
      },
      {
        fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      transaction: txResponse,
      stats: {
        wins: newWins,
        losses: newLosses,
      },
    });

  } catch (error) {
    console.error("Update profile stats error:", error);
    return NextResponse.json(
      { error: `Something went wrong: ${error}` },
      { status: 500 }
    );
  }
}


