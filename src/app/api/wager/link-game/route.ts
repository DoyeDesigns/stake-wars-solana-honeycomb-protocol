import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { WagerGame } from "@/types/wager";

export async function POST(request: NextRequest) {
  try {
    const { wagerId, gameRoomId } = await request.json();

    console.log("Link wager to game room:", { wagerId, gameRoomId });

    if (!wagerId || !gameRoomId) {
      return NextResponse.json(
        { error: "Missing wagerId or gameRoomId" },
        { status: 400 }
      );
    }

    // Get wager game
    const wagerRef = doc(db, 'wagerGames', wagerId);
    const wagerSnap = await getDoc(wagerRef);

    if (!wagerSnap.exists()) {
      return NextResponse.json(
        { error: "Wager game not found" },
        { status: 404 }
      );
    }

    const wagerGame = wagerSnap.data() as WagerGame;

    if (wagerGame.status !== 'in_progress') {
      return NextResponse.json(
        { error: "Wager game is not in progress" },
        { status: 400 }
      );
    }

    // Link game room to wager
    await updateDoc(wagerRef, {
      gameRoomId,
    });

    // Also add wager info to game room for easy reference
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    await updateDoc(gameRoomRef, {
      wagerId,
      wagerAmount: wagerGame.wagerAmount,
      isWagerMatch: true,
    });

    return NextResponse.json({
      success: true,
      message: "Game room linked to wager successfully",
    });

  } catch (error) {
    console.error("Link wager to game error:", error);
    return NextResponse.json(
      { error: `Failed to link game room: ${error}` },
      { status: 500 }
    );
  }
}

