"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";

interface LeaderboardProfile {
  address: string;
  walletAddress: string;
  identity: string;
  userId: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  xp: number;
  level: number;
  rankName: string;
  rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [rawLeaderboard, setRawLeaderboard] = useState<LeaderboardProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'wins' | 'winRate' | 'xp' | 'level'>('wins');

  useEffect(() => {
    fetchLeaderboard();
  }, []); // Fetch only once

  // Sort leaderboard using useMemo
  const leaderboard = useMemo(() => {
    console.log(`🔄 Sorting leaderboard by: ${sortBy} (client-side)`);
    
    const sorted = [...rawLeaderboard].sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          // Sort by win rate, then by total games (tiebreaker)
          if (b.winRate !== a.winRate) {
            return b.winRate - a.winRate;
          }
          return b.totalGames - a.totalGames;
        
        case 'xp':
          return b.xp - a.xp;
        
        case 'level':
          // Sort by level, then by XP (tiebreaker)
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.xp - a.xp;
        
        case 'wins':
        default:
          // Sort by wins, then by win rate (tiebreaker)
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          return b.winRate - a.winRate;
      }
    });

    // Reassign ranks after sorting
    const ranked = sorted.map((profile, index) => ({
      ...profile,
      rank: index + 1,
    }));

    // Log top 5 after client-side sorting
    if (ranked.length > 0) {
      console.log(`\n=== TOP 5 AFTER SORTING BY ${sortBy.toUpperCase()} ===`);
      ranked.slice(0, 5).forEach((profile) => {
        console.log(`${profile.rank}. ${profile.walletAddress} - ${profile.wins}W/${profile.losses}L (${profile.winRate}%) - Level ${profile.level} (${profile.rankName}), XP: ${profile.xp}`);
      });
      console.log("=== END TOP 5 ===\n");
    }

    return ranked;
  }, [rawLeaderboard, sortBy]);

  // Find current user's rank from sorted leaderboard
  const myRank = useMemo(() => {
    if (publicKey && leaderboard.length > 0) {
      return leaderboard.find(
        (profile) => profile.walletAddress === publicKey.toString()
      ) || null;
    }
    return null;
  }, [publicKey, leaderboard]);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log("🏆 Fetching leaderboard data (will sort client-side)");
      
      // Fetch without sortBy - we'll sort with useMemo
      const response = await fetch(`/api/leaderboard?limit=100`);
      const data = await response.json();

      console.log("📊 Leaderboard API response:", data);

      if (data.success) {
        setRawLeaderboard(data.leaderboard);
        console.log(`✅ Loaded ${data.count} profiles for leaderboard (${data.totalProfiles} total)`);
        
        if (isRefresh) {
          toast.success("Leaderboard refreshed!");
        }
        
        // Log all profiles for inspection
        console.log("\n=== ALL LEADERBOARD PROFILES ===");
        console.table(data.leaderboard.map((p: LeaderboardProfile) => ({
          Rank: p.rank,
          Wallet: p.walletAddress.slice(0, 12) + '...',
          Wins: p.wins,
          Losses: p.losses,
          WinRate: p.winRate + '%',
          Level: `${p.level} (${p.rankName})`,
          XP: p.xp,
          Games: p.totalGames
        })));
        console.log("=== END ALL PROFILES ===\n");
      } else {
        toast.error(`Failed to load leaderboard: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400"; // Gold
    if (rank === 2) return "text-gray-300"; // Silver
    if (rank === 3) return "text-orange-400"; // Bronze
    return "text-white";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mb-4"
          >
            ← Back to Home
          </Button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🏆 Leaderboard
              </h1>
              <p className="text-gray-300">
                Top players ranked by performance
              </p>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Sort Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSortBy('wins')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                sortBy === 'wins'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Most Wins
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                sortBy === 'winRate'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Win Rate %
            </button>
            <button
              onClick={() => setSortBy('xp')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                sortBy === 'xp'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Most XP
            </button>
            <button
              onClick={() => setSortBy('level')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                sortBy === 'level'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Highest Level
            </button>
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-3">Your Ranking</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Rank</p>
                <p className={`text-2xl font-bold ${getRankColor(myRank.rank)}`}>
                  {getRankIcon(myRank.rank)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Wins</p>
                <p className="text-green-400 text-xl font-bold">{myRank.wins}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-blue-400 text-xl font-bold">{myRank.winRate}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Level</p>
                <p className="text-purple-400 text-xl font-bold">
                  {myRank.level} ({myRank.rankName})
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">XP</p>
                <p className="text-yellow-400 text-xl font-bold">{myRank.xp}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {leaderboard.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">
              No players found. Be the first to play and claim your spot!
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl overflow-hidden">
            {/* Horizontal Scroll Container for Mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-[768px]">
                {/* Table Header */}
                <div className="bg-gray-900/50 px-6 py-4 grid grid-cols-7 gap-4 text-gray-400 text-sm font-semibold border-b border-gray-700">
                  <div>Rank</div>
                  <div className="col-span-2">Player</div>
                  <div className="text-center">Wins</div>
                  <div className="text-center">Win Rate</div>
                  <div className="text-center">Level</div>
                  <div className="text-center">XP</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-700">
                  {leaderboard.map((profile) => {
                    const isCurrentUser = publicKey?.toString() === profile.walletAddress;
                    
                    return (
                      <div
                        key={profile.address}
                        className={`px-6 py-4 grid grid-cols-7 gap-4 items-center transition-colors ${
                          isCurrentUser
                            ? 'bg-purple-500/20 border-l-4 border-purple-500'
                            : 'hover:bg-gray-700/30'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`text-2xl font-bold ${getRankColor(profile.rank)}`}>
                          {getRankIcon(profile.rank)}
                        </div>

                        {/* Player Wallet Address */}
                        <div className="col-span-2">
                          <p className="text-white font-semibold truncate">
                            {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-6)}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Wins */}
                        <div className="text-center">
                          <p className="text-green-400 font-bold">{profile.wins}</p>
                          <p className="text-gray-500 text-xs">{profile.losses}L</p>
                        </div>

                        {/* Win Rate */}
                        <div className="text-center">
                          <p className="text-blue-400 font-bold">{profile.winRate}%</p>
                          <p className="text-gray-500 text-xs">{profile.totalGames} games</p>
                        </div>

                        {/* Level */}
                        <div className="text-center">
                          <p className="text-purple-400 font-bold">
                            {profile.level} ({profile.rankName})
                          </p>
                        </div>

                        {/* XP */}
                        <div className="text-center">
                          <p className="text-yellow-400 font-bold">{profile.xp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Leaderboard Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Players</p>
              <p className="text-white text-2xl font-bold">{leaderboard.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Games Played</p>
              <p className="text-white text-2xl font-bold">
                {leaderboard.reduce((sum, p) => sum + p.totalGames, 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Win Rate</p>
              <p className="text-white text-2xl font-bold">
                {leaderboard.length > 0
                  ? Math.round(
                      leaderboard.reduce((sum, p) => sum + p.winRate, 0) / leaderboard.length
                    )
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total XP Earned</p>
              <p className="text-white text-2xl font-bold">
                {leaderboard.reduce((sum, p) => sum + p.xp, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

