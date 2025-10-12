import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament, BracketMatch } from "@/types/tournament";
import { getActiveMatches } from "@/lib/tournamentBracket";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');

    if (!playerAddress) {
      return NextResponse.json(
        { error: "Player address is required" },
        { status: 400 }
      );
    }

    // Find all in-progress tournaments where player is a participant
    const q = query(
      collection(db, 'tournaments'),
      where('status', '==', 'in_progress')
    );

    const querySnapshot = await getDocs(q);
    const activeMatches: Array<BracketMatch & { tournamentId: string; tournamentName: string }> = [];

    querySnapshot.forEach((doc) => {
      const tournament = { id: doc.id, ...doc.data() } as Tournament;
      
      // Check if player is in this tournament
      const isParticipant = tournament.participants.some(
        p => p.address === playerAddress
      );

      if (isParticipant && tournament.bracket) {
        // Get all active matches
        const matches = getActiveMatches(tournament.bracket);
        
        // Filter matches where this player is involved
        const playerMatches = matches.filter(
          match => 
            match.player1?.address === playerAddress || 
            match.player2?.address === playerAddress
        );

        playerMatches.forEach(match => {
          activeMatches.push({
            ...match,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      matches: activeMatches,
      count: activeMatches.length,
    });

  } catch (error) {
    console.error("Get active matches error:", error);
    return NextResponse.json(
      { error: `Failed to fetch active matches: ${error}` },
      { status: 500 }
    );
  }
}

