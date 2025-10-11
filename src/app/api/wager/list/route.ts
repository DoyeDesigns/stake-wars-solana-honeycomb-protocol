import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
import { WagerGame } from "@/types/wager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const playerAddress = searchParams.get('player');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    console.log("List wagers request:", { status, playerAddress, limitCount });

    const wagerGamesRef = collection(db, 'wagerGames');
    
    let q;
    
    if (playerAddress) {
      // Get games for a specific player - simplified without orderBy to avoid index requirement
      const creatorQuery = query(
        wagerGamesRef,
        where('creatorAddress', '==', playerAddress),
        limit(limitCount)
      );
      const challengerQuery = query(
        wagerGamesRef,
        where('challengerAddress', '==', playerAddress),
        limit(limitCount)
      );
      
      const [creatorSnap, challengerSnap] = await Promise.all([
        getDocs(creatorQuery),
        getDocs(challengerQuery)
      ]);

      const games = new Map<string, WagerGame>();
      
      creatorSnap.forEach((doc) => {
        games.set(doc.id, { id: doc.id, ...doc.data() } as WagerGame);
      });
      
      challengerSnap.forEach((doc) => {
        games.set(doc.id, { id: doc.id, ...doc.data() } as WagerGame);
      });

      // Sort in memory instead of using Firestore orderBy
      const wagerGames = Array.from(games.values())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limitCount);

      return NextResponse.json({
        success: true,
        wagerGames,
        count: wagerGames.length,
      });
    } else {
      // Get games by status - simplified without orderBy to avoid index requirement
      q = query(
        wagerGamesRef,
        where('status', '==', status),
        limit(limitCount * 2) // Get more results since we'll sort in memory
      );

      const querySnapshot = await getDocs(q);
      const wagerGames: WagerGame[] = [];

      querySnapshot.forEach((doc) => {
        wagerGames.push({ id: doc.id, ...doc.data() } as WagerGame);
      });

      // Sort in memory and apply limit
      const sortedWagers = wagerGames
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limitCount);

      return NextResponse.json({
        success: true,
        wagerGames: sortedWagers,
        count: sortedWagers.length,
      });
    }

  } catch (error) {
    console.error("List wagers error:", error);
    return NextResponse.json(
      { error: `Failed to list wager games: ${error}` },
      { status: 500 }
    );
  }
}

