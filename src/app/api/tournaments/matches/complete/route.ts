import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";
import { progressWinner, isTournamentComplete } from "@/lib/tournamentBracket";

interface CompleteMatchRequest {
  tournamentId: string;
  matchId: string;
  winnerId: string;
  roomId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompleteMatchRequest = await request.json();
    const { tournamentId, matchId, winnerId, roomId } = body;

    console.log("Complete match request:", { tournamentId, matchId, winnerId, roomId });

    if (!tournamentId || !matchId || !winnerId) {
      return NextResponse.json(
        { error: "Missing required fields: tournamentId, matchId, winnerId" },
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

    if (!tournament.bracket) {
      return NextResponse.json(
        { error: "Tournament bracket not found" },
        { status: 400 }
      );
    }

    // Find the match
    const match = tournament.bracket.find(m => m.matchId === matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Verify the roomId matches (if provided in match)
    if (roomId && match.roomId && match.roomId !== roomId) {
      return NextResponse.json(
        { error: "Room ID mismatch" },
        { status: 400 }
      );
    }

    // Verify winner is one of the players
    const isValidWinner = 
      match.player1?.address === winnerId || 
      match.player2?.address === winnerId;

    if (!isValidWinner) {
      return NextResponse.json(
        { error: "Winner must be one of the match players" },
        { status: 400 }
      );
    }

    // Progress winner to next round
    const updatedBracket = progressWinner(tournament.bracket, matchId, winnerId);

    // Check if tournament is complete
    const isComplete = isTournamentComplete(updatedBracket);

    // Create game room for next match if winner progressed
    if (!isComplete) {
      // Find the next match this winner is in
      const nextMatch = updatedBracket.find(m => 
        (m.player1?.address === winnerId || m.player2?.address === winnerId) && 
        !m.winner && 
        !m.roomId &&
        m.player1 && 
        m.player2
      );

      if (nextMatch) {
        // Both players are now assigned to this match, create game room
        const gameRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const { CHARACTERS } = await import("@/lib/characters");
        const player1Character = CHARACTERS.find(c => c.id === nextMatch.player1?.characterId);
        const player2Character = CHARACTERS.find(c => c.id === nextMatch.player2?.characterId);
        
        if (player1Character && player2Character) {
          const { setDoc, doc } = await import("firebase/firestore");
          const { db } = await import("@/config/firebase");
          
          const gameRoomRef = doc(db, "gameRooms", gameRoomId);
          await setDoc(gameRoomRef, {
            id: gameRoomId,
            createdBy: nextMatch.player1.address,
            createdAt: Date.now(),
            status: "character-select",
            isTournamentMatch: true,
            tournamentId,
            matchId: nextMatch.matchId,
            players: {
              [nextMatch.player1.address]: {
                wallet: nextMatch.player1.address,
                role: "creator",
                characterId: nextMatch.player1.characterId,
                diceRoll: null,
              },
              [nextMatch.player2.address]: {
                wallet: nextMatch.player2.address,
                role: "challenger",
                characterId: nextMatch.player2.characterId,
                diceRoll: null,
              },
            },
            gameState: {
              gameStatus: "character-select",
              currentTurn: null,
              turnCount: 0,
              player1: {
                id: nextMatch.player1.address,
                character: player1Character,
                currentHealth: player1Character.baseHealth,
                maxHealth: player1Character.baseHealth,
                defenseInventory: {},
                buffs: [],
              },
              player2: {
                id: nextMatch.player2.address,
                character: player2Character,
                currentHealth: player2Character.baseHealth,
                maxHealth: player2Character.baseHealth,
                defenseInventory: {},
                buffs: [],
              },
              diceRolls: {},
              gameHistory: [],
            },
          });
          
          // Update the match with the room ID
          nextMatch.roomId = gameRoomId;
          console.log(`✅ Created game room ${gameRoomId} for next match ${nextMatch.matchId}`);
        }
      }
    }

    const updateData: Record<string, unknown> = {
      bracket: updatedBracket,
    };

    if (isComplete) {
      updateData.status = 'completed';
      updateData.completedAt = Date.now();
      console.log(`🏆 Tournament ${tournamentId} completed!`);
      
      // Auto-distribute prizes when tournament completes
      try {
        const { getTopWinners } = await import("@/lib/tournamentBracket");
        
        const topWinners = getTopWinners(updatedBracket, tournament.numberOfWinners);
        
        if (topWinners.length > 0) {
          const distributions: Array<{
            address: string;
            amount: number;
            position: string;
          }> = [];
          
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
          
          updateData.prizesDistributed = true;
          updateData.prizeDistribution = distributions;
          updateData.prizesDistributedAt = Date.now();
          
          console.log("💰 Prizes auto-distributed:", distributions);
        }
      } catch (prizeError) {
        console.error("Failed to distribute prizes:", prizeError);
        // Don't fail the whole request if prize distribution fails
      }
    }

    await updateDoc(tournamentRef, updateData);

    return NextResponse.json({
      success: true,
      message: isComplete ? "Match completed and tournament finished!" : "Match completed, winner progressed",
      bracket: updatedBracket,
      tournamentComplete: isComplete,
    });

  } catch (error) {
    console.error("Complete match error:", error);
    return NextResponse.json(
      { error: `Failed to complete match: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

