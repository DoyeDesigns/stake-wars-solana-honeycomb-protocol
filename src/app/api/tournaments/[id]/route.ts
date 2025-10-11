import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
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

    const tournament: Tournament = {
      id: tournamentSnap.id,
      ...tournamentSnap.data(),
    } as Tournament;

    return NextResponse.json({
      success: true,
      tournament,
    });

  } catch (error) {
    console.error("Get tournament error:", error);
    return NextResponse.json(
      { error: `Failed to fetch tournament: ${error}` },
      { status: 500 }
    );
  }
}

