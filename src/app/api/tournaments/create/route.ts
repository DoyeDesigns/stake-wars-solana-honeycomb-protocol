import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { CreateTournamentRequest, PrizeSplit } from "@/types/tournament";

// Default prize splits based on number of winners
// Only 1, 2, or 4 winners allowed
// 4 winners includes a 3rd place match between semifinal losers
const DEFAULT_PRIZE_SPLITS: Record<number, PrizeSplit> = {
  1: { first: 100 }, // Winner takes all
  2: { first: 70, second: 30 }, // Finals winner + loser
  4: { first: 50, second: 30, third: 15, fourth: 5 }, // Top 4 with 3rd place match
};

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;

export async function POST(request: NextRequest) {
  try {
    const body: CreateTournamentRequest = await request.json();
    const { name, entryFee, maxParticipants, numberOfWinners, prizeSplit, description, hostAddress, hostName } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tournament name is required" },
        { status: 400 }
      );
    }

    if (!hostAddress) {
      return NextResponse.json(
        { error: "Host address is required" },
        { status: 400 }
      );
    }

    // Restrict tournament creation to admin only
    if (!PROJECT_AUTHORITY) {
      return NextResponse.json(
        { error: "Project authority not configured" },
        { status: 500 }
      );
    }

    if (hostAddress !== PROJECT_AUTHORITY) {
      return NextResponse.json(
        { error: "Only admin can create tournaments" },
        { status: 403 }
      );
    }

    if (!entryFee || entryFee <= 0) {
      return NextResponse.json(
        { error: "Entry fee must be greater than 0" },
        { status: 400 }
      );
    }

    if (![2, 4, 8, 16, 32].includes(maxParticipants)) {
      return NextResponse.json(
        { error: "Maximum participants must be 2, 4, 8, 16, or 32" },
        { status: 400 }
      );
    }

    // Determine max winners and validate
    // Only allow 1, 2, or 4 winners for all tournaments
    // 2-player tournaments can't have 4 winners (only 2 players exist)
    
    const validWinnerCounts = maxParticipants === 2 ? [1, 2] : [1, 2, 4];
    
    if (numberOfWinners && !validWinnerCounts.includes(numberOfWinners)) {
      return NextResponse.json(
        { error: `Invalid number of winners. Must be ${maxParticipants === 2 ? '1 or 2' : '1, 2, or 4'}. Select 4 for a 3rd place match between semifinal losers.` },
        { status: 400 }
      );
    }
    
    const finalNumberOfWinners = numberOfWinners && validWinnerCounts.includes(numberOfWinners)
      ? numberOfWinners
      : 2; // Default: 2 winners (finals winner + loser)

    // Validate prize split
    const finalPrizeSplit = prizeSplit || DEFAULT_PRIZE_SPLITS[finalNumberOfWinners];
    
    // Calculate total percentage based on number of winners
    let totalPercentage = finalPrizeSplit.first || 0;
    
    if (finalNumberOfWinners >= 2) {
      totalPercentage += finalPrizeSplit.second || 0;
    }
    
    if (finalNumberOfWinners === 4) {
      totalPercentage += finalPrizeSplit.third || 0;
      totalPercentage += finalPrizeSplit.fourth || 0;
    }
    
    if (totalPercentage !== 100) {
      return NextResponse.json(
        { error: "Prize split percentages must add up to 100" },
        { status: 400 }
      );
    }

    // Create tournament document
    const tournamentData = {
      name: name.trim(),
      hostAddress,
      hostName: hostName || 'Anonymous',
      entryFee,
      maxParticipants,
      numberOfWinners: finalNumberOfWinners,
      currentParticipants: 0,
      prizePool: 0,
      prizeSplit: finalPrizeSplit,
      status: 'open',
      participants: [],
      createdAt: Date.now(),
      description: description?.trim() || '',
    };

    const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);

    return NextResponse.json({
      success: true,
      tournamentId: docRef.id,
      tournament: {
        id: docRef.id,
        ...tournamentData,
      },
    });

  } catch (error) {
    console.error("Create tournament error:", error);
    return NextResponse.json(
      { error: `Failed to create tournament: ${error}` },
      { status: 500 }
    );
  }
}

