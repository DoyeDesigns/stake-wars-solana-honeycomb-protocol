import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";

interface DistributePrizesRequest {
  tournamentId: string;
}

interface PrizeDistribution {
  address: string;
  amount: number;
  position: string;
  transactionSignature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DistributePrizesRequest = await request.json();
    const { tournamentId } = body;

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

    const tournament = { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;

    // Verify tournament is completed
    if (tournament.status !== 'completed') {
      return NextResponse.json(
        { error: "Tournament is not completed yet" },
        { status: 400 }
      );
    }

    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found" },
        { status: 400 }
      );
    }

    // Get top winners based on tournament configuration
    const { getTopWinners } = await import("@/lib/tournamentBracket");
    const topWinners = getTopWinners(tournament.bracket, tournament.numberOfWinners);

    if (topWinners.length === 0) {
      return NextResponse.json(
        { error: "No tournament winners found" },
        { status: 400 }
      );
    }

    // Calculate prize amounts based on prize pool and split
    const distributions: PrizeDistribution[] = [];
    const positionLabels = ['1st', '2nd', '3rd', '4th', '5th'];
    const prizeKeys: Array<keyof typeof tournament.prizeSplit> = ['first', 'second', 'third', 'fourth', 'fifth'];
    
    topWinners.forEach((winner, index) => {
      const prizeKey = prizeKeys[index];
      const prizePercentage = tournament.prizeSplit[prizeKey] || 0;
      
      if (prizePercentage > 0) {
        const prizeAmount = Math.floor((tournament.prizePool * prizePercentage) / 100);
        
        distributions.push({
          address: winner.address,
          amount: prizeAmount,
          position: positionLabels[index],
        });
      }
    });

    console.log("💰 Prize distribution plan:", distributions);

    // Record prize distribution data (players will claim via separate endpoint)
    // Prizes are not sent automatically - players must claim them
    // This prevents double-claiming and allows for better tracking
    await updateDoc(tournamentRef, {
      prizesDistributed: true,
      prizeDistribution: distributions,
      prizesDistributedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Prizes distributed successfully",
      distributions,
      totalDistributed: distributions.reduce((sum, d) => sum + d.amount, 0),
    });

  } catch (error) {
    console.error("Distribute prizes error:", error);
    return NextResponse.json(
      { error: `Failed to distribute prizes: ${error}` },
      { status: 500 }
    );
  }
}

