import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { CreateTournamentRequest, PrizeSplit } from "@/types/tournament";

const DEFAULT_PRIZE_SPLIT: PrizeSplit = {
  first: 60,
  second: 30,
  third: 10,
};

export async function POST(request: NextRequest) {
  try {
    const body: CreateTournamentRequest = await request.json();
    const { name, entryFee, maxParticipants, prizeSplit, description, hostAddress, hostName } = body;

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

    if (!entryFee || entryFee <= 0) {
      return NextResponse.json(
        { error: "Entry fee must be greater than 0" },
        { status: 400 }
      );
    }

    if (![8, 16, 32].includes(maxParticipants)) {
      return NextResponse.json(
        { error: "Maximum participants must be 8, 16, or 32" },
        { status: 400 }
      );
    }

    // Validate prize split
    const finalPrizeSplit = prizeSplit || DEFAULT_PRIZE_SPLIT;
    const totalPercentage = finalPrizeSplit.first + finalPrizeSplit.second + finalPrizeSplit.third;
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

