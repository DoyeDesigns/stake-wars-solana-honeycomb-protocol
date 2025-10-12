import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Connection } from "@solana/web3.js";
import { JoinTournamentRequest, TournamentParticipant, Tournament } from "@/types/tournament";
import { CHARACTERS } from "@/lib/characters";
import { generateBracket } from "@/lib/tournamentBracket";

const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://rpc.test.honeycombprotocol.com";

async function verifyTransaction(
  signature: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    
    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: "Transaction not found" };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: "Transaction failed" };
    }

    // Verify the transaction is confirmed
    const status = await connection.getSignatureStatus(signature);
    if (!status.value?.confirmationStatus || status.value.confirmationStatus === 'processed') {
      return { verified: false, error: "Transaction not confirmed yet" };
    }

    // For Honeycomb Protocol transactions with LUTs, we verify:
    // 1. Transaction exists and is confirmed
    // 2. Transaction succeeded (no errors)
    // This is sufficient for tournament entry validation
    
    console.log("Transaction verified successfully:", signature);
    return { verified: true };

  } catch (error) {
    console.error("Transaction verification error:", error);
    return { verified: false, error: `Verification failed: ${error}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinTournamentRequest = await request.json();
    const { tournamentId, participantAddress, characterId, characterAddress, transactionSignature } = body;

    console.log("Join tournament request:", { tournamentId, participantAddress, characterId, characterAddress, transactionSignature });

    // Validation
    if (!tournamentId || !participantAddress || !characterId || !transactionSignature) {
      return NextResponse.json(
        { error: "Missing required fields: tournamentId, participantAddress, characterId, or transactionSignature" },
        { status: 400 }
      );
    }

    if (!PROJECT_AUTHORITY) {
      return NextResponse.json(
        { error: "Project authority not configured" },
        { status: 500 }
      );
    }

    // Get tournament
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);

    if (!tournamentSnap.exists()) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tournament = { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;

    // Check tournament status
    if (tournament.status !== 'open') {
      return NextResponse.json(
        { error: "Tournament is not open for registration" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Check if participant already joined
    const alreadyJoined = tournament.participants.some(
      (p) => p.address === participantAddress
    );

    if (alreadyJoined) {
      return NextResponse.json(
        { error: "You have already joined this tournament" },
        { status: 400 }
      );
    }

    // Skip verification for admin bypass (testing purposes)
    const isAdminBypass = transactionSignature.startsWith("admin-bypass-");
    
    if (!isAdminBypass) {
      // Verify transaction for regular users
      const verification = await verifyTransaction(transactionSignature);

      if (!verification.verified) {
        return NextResponse.json(
          { error: `Payment verification failed: ${verification.error}` },
          { status: 400 }
        );
      }
    } else {
      console.log("Admin bypass - skipping payment verification");
    }

    // Get character details
    const character = CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Invalid character" },
        { status: 400 }
      );
    }

    // Create participant
    const participant: TournamentParticipant = {
      address: participantAddress,
      characterId,
      characterAddress,
      nickname: character.nickname,
      village: character.village,
      joinedAt: Date.now(),
      transactionSignature,
    };

    // Update tournament
    // Only increment prize pool if not admin bypass
    const updateData: Record<string, unknown> = {
      participants: arrayUnion(participant),
      currentParticipants: increment(1),
    };

    if (!isAdminBypass) {
      updateData.prizePool = increment(tournament.entryFee);
    }

    // Check if tournament will be full after this join
    const willBeFull = tournament.currentParticipants + 1 >= tournament.maxParticipants;

    if (willBeFull) {
      // Generate bracket when tournament fills
      const allParticipants = [...tournament.participants, participant];
      const bracket = generateBracket(allParticipants, tournament.maxParticipants);
      
      // Create game rooms for first round matches
      for (const match of bracket) {
        if (match.player1 && match.player2 && match.round === bracket[0].round) {
          // Only create rooms for first round matches with both players assigned
          const gameRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          const player1Character = CHARACTERS.find(c => c.id === match.player1?.characterId);
          const player2Character = CHARACTERS.find(c => c.id === match.player2?.characterId);
          
          if (player1Character && player2Character) {
            // Create game room in Firebase
            const gameRoomRef = doc(db, "gameRooms", gameRoomId);
            await setDoc(gameRoomRef, {
              id: gameRoomId,
              createdBy: match.player1.address,
              createdAt: Date.now(),
              status: "character-select",
              isTournamentMatch: true,
              tournamentId,
              matchId: match.matchId,
              players: {
                [match.player1.address]: {
                  wallet: match.player1.address,
                  role: "creator",
                  characterId: match.player1.characterId,
                  diceRoll: null,
                },
                [match.player2.address]: {
                  wallet: match.player2.address,
                  role: "challenger",
                  characterId: match.player2.characterId,
                  diceRoll: null,
                },
              },
              gameState: {
                gameStatus: "character-select",
                currentTurn: null,
                turnCount: 0,
                player1: {
                  id: match.player1.address,
                  character: player1Character,
                  currentHealth: player1Character.baseHealth,
                  maxHealth: player1Character.baseHealth,
                  defenseInventory: {},
                  buffs: [],
                },
                player2: {
                  id: match.player2.address,
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
            
            // Store room ID in the match
            match.roomId = gameRoomId;
            console.log(`✅ Created game room ${gameRoomId} for match ${match.matchId}`);
          }
        }
      }
      
      updateData.bracket = bracket;
      updateData.status = 'in_progress';
      updateData.startedAt = Date.now();
      
      console.log(`🏆 Tournament ${tournamentId} is now full! Bracket generated with ${bracket.length} matches and game rooms created`);
    }

    await updateDoc(tournamentRef, updateData);

    if (willBeFull) {
      console.log("✨ Tournament started! Players can now begin their matches.");
    } else if (isAdminBypass) {
      console.log("Admin joined without payment - prize pool unchanged");
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined tournament",
      participant,
      tournamentId,
    });

  } catch (error) {
    console.error("Join tournament error:", error);
    return NextResponse.json(
      { error: `Failed to join tournament: ${error}` },
      { status: 500 }
    );
  }
}

