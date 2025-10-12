import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Tournament } from "@/types/tournament";
import { getTournamentWinner, getSecondPlace, getThirdPlaceCandidates } from "@/lib/tournamentBracket";

interface TournamentWinRecord {
  playerAddress: string;
  tournamentId: string;
  tournamentName: string;
  position: number;
  prizeWon: number;
  completedAt: number;
}

interface TournamentLeaderboardEntry {
  playerAddress: string;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
  totalWins: number;
  totalPrizesWon: number;
  tournamentsParticipated: number;
  recentWins: TournamentWinRecord[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    // Fetch completed tournaments
    const q = query(
      collection(db, 'tournaments'),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const tournaments: Tournament[] = [];

    querySnapshot.forEach((doc) => {
      tournaments.push({
        id: doc.id,
        ...doc.data(),
      } as Tournament);
    });

    console.log(`Found ${tournaments.length} completed tournaments`);

    // Build leaderboard from tournament results
    const playerStats = new Map<string, TournamentLeaderboardEntry>();
    
    tournaments.forEach((tournament) => {
      if (!tournament.bracket) return;

      const winner = getTournamentWinner(tournament.bracket);
      const second = getSecondPlace(tournament.bracket);
      const thirds = getThirdPlaceCandidates(tournament.bracket);

      // Process winner (1st place)
      if (winner) {
        const prizeAmount = Math.floor((tournament.prizePool * tournament.prizeSplit.first) / 100);
        
        if (!playerStats.has(winner.address)) {
          playerStats.set(winner.address, {
            playerAddress: winner.address,
            firstPlaceCount: 0,
            secondPlaceCount: 0,
            thirdPlaceCount: 0,
            totalWins: 0,
            totalPrizesWon: 0,
            tournamentsParticipated: 0,
            recentWins: [],
          });
        }
        
        const stats = playerStats.get(winner.address)!;
        stats.firstPlaceCount++;
        stats.totalWins++;
        stats.totalPrizesWon += prizeAmount;
        stats.recentWins.push({
          playerAddress: winner.address,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          position: 1,
          prizeWon: prizeAmount,
          completedAt: tournament.completedAt || 0,
        });
      }

      // Process second place
      if (second && tournament.prizeSplit.second) {
        const prizeAmount = Math.floor((tournament.prizePool * tournament.prizeSplit.second) / 100);
        
        if (!playerStats.has(second.address)) {
          playerStats.set(second.address, {
            playerAddress: second.address,
            firstPlaceCount: 0,
            secondPlaceCount: 0,
            thirdPlaceCount: 0,
            totalWins: 0,
            totalPrizesWon: 0,
            tournamentsParticipated: 0,
            recentWins: [],
          });
        }
        
        const stats = playerStats.get(second.address)!;
        stats.secondPlaceCount++;
        stats.totalWins++;
        stats.totalPrizesWon += prizeAmount;
        stats.recentWins.push({
          playerAddress: second.address,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          position: 2,
          prizeWon: prizeAmount,
          completedAt: tournament.completedAt || 0,
        });
      }

      // Process third place
      if (thirds.length > 0 && tournament.prizeSplit.third) {
        const thirdPrizeAmount = Math.floor((tournament.prizePool * tournament.prizeSplit.third) / 100);
        const prizePerPlayer = Math.floor(thirdPrizeAmount / thirds.length);
        
        thirds.forEach(third => {
          if (!playerStats.has(third.address)) {
            playerStats.set(third.address, {
              playerAddress: third.address,
              firstPlaceCount: 0,
              secondPlaceCount: 0,
              thirdPlaceCount: 0,
              totalWins: 0,
              totalPrizesWon: 0,
              tournamentsParticipated: 0,
              recentWins: [],
            });
          }
          
          const stats = playerStats.get(third.address)!;
          stats.thirdPlaceCount++;
          stats.totalWins++;
          stats.totalPrizesWon += prizePerPlayer;
          stats.recentWins.push({
            playerAddress: third.address,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            position: 3,
            prizeWon: prizePerPlayer,
            completedAt: tournament.completedAt || 0,
          });
        });
      }

      // Count participation for all tournament participants
      tournament.participants.forEach(participant => {
        if (!playerStats.has(participant.address)) {
          playerStats.set(participant.address, {
            playerAddress: participant.address,
            firstPlaceCount: 0,
            secondPlaceCount: 0,
            thirdPlaceCount: 0,
            totalWins: 0,
            totalPrizesWon: 0,
            tournamentsParticipated: 0,
            recentWins: [],
          });
        }
        const stats = playerStats.get(participant.address)!;
        stats.tournamentsParticipated++;
      });
    });

    // Convert to array and sort by total wins, then prizes won
    let leaderboard = Array.from(playerStats.values());

    // Sort recent wins by date (most recent first) and limit to 5
    leaderboard.forEach(entry => {
      entry.recentWins.sort((a, b) => b.completedAt - a.completedAt);
      entry.recentWins = entry.recentWins.slice(0, 5);
    });

    // If playerAddress is provided, return only that player's stats
    if (playerAddress) {
      const playerEntry = leaderboard.find(p => p.playerAddress === playerAddress);
      
      return NextResponse.json({
        success: true,
        player: playerEntry || {
          playerAddress,
          firstPlaceCount: 0,
          secondPlaceCount: 0,
          thirdPlaceCount: 0,
          totalWins: 0,
          totalPrizesWon: 0,
          tournamentsParticipated: 0,
          recentWins: [],
        },
      });
    }

    // Sort leaderboard
    leaderboard.sort((a, b) => {
      // Primary: First place wins
      if (b.firstPlaceCount !== a.firstPlaceCount) {
        return b.firstPlaceCount - a.firstPlaceCount;
      }
      // Secondary: Total wins (including 2nd and 3rd)
      if (b.totalWins !== a.totalWins) {
        return b.totalWins - a.totalWins;
      }
      // Tertiary: Total prizes won
      return b.totalPrizesWon - a.totalPrizesWon;
    });

    // Apply limit
    leaderboard = leaderboard.slice(0, limitCount);

    return NextResponse.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
      totalPlayers: playerStats.size,
      totalTournaments: tournaments.length,
    });

  } catch (error) {
    console.error("Tournament leaderboard error:", error);
    return NextResponse.json(
      { error: `Failed to fetch tournament leaderboard: ${error}` },
      { status: 500 }
    );
  }
}

