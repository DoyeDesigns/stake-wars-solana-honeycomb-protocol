import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitNum = parseInt(searchParams.get('limit') || '20');

    let q = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );

    if (status) {
      q = query(
        collection(db, 'tournaments'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitNum)
      );
    }

    const querySnapshot = await getDocs(q);
    const tournaments: Tournament[] = [];

    querySnapshot.forEach((doc) => {
      tournaments.push({
        id: doc.id,
        ...doc.data(),
      } as Tournament);
    });

    return NextResponse.json({
      success: true,
      tournaments,
      count: tournaments.length,
    });

  } catch (error) {
    console.error("List tournaments error:", error);
    return NextResponse.json(
      { error: `Failed to fetch tournaments: ${error}` },
      { status: 500 }
    );
  }
}

