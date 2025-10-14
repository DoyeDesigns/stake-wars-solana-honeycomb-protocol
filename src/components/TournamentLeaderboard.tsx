"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export default function TournamentLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTournaments, setTotalTournaments] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments/leaderboard?limit=50');
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
        setTotalTournaments(data.totalTournaments);
      }
    } catch (error) {
      console.error("Failed to fetch tournament leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getMedalEmoji = (position: number): string => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading tournament leaderboard...</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="text-white text-xl">No tournament data yet</div>
        <p className="text-gray-400 text-sm">Complete tournaments to see the leaderboard</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          🏆 Tournament Champions
        </h2>
        <p className="text-gray-400">
          {totalTournaments} completed tournaments
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥈</div>
            <div className="bg-gradient-to-b from-gray-400 to-gray-600 rounded-lg p-4 w-32 h-24 flex flex-col justify-center items-center">
              <p className="text-white font-bold text-sm">
                {formatAddress(leaderboard[1].playerAddress)}
              </p>
              <p className="text-gray-200 text-xs mt-1">
                {leaderboard[1].firstPlaceCount} wins
              </p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-2">🥇</div>
            <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg p-4 w-32 h-32 flex flex-col justify-center items-center border-4 border-yellow-300">
              <p className="text-white font-bold text-sm">
                {formatAddress(leaderboard[0].playerAddress)}
              </p>
              <p className="text-gray-900 text-xs mt-1 font-bold">
                {leaderboard[0].firstPlaceCount} wins
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥉</div>
            <div className="bg-gradient-to-b from-orange-400 to-orange-600 rounded-lg p-4 w-32 h-20 flex flex-col justify-center items-center">
              <p className="text-white font-bold text-sm">
                {formatAddress(leaderboard[2].playerAddress)}
              </p>
              <p className="text-gray-100 text-xs mt-1">
                {leaderboard[2].firstPlaceCount} wins
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#2a2a2a] border-b border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Player
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                🥇
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                🥈
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                🥉
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                Total Wins
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                Tournaments
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                Total Prizes
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.playerAddress}
                className={`border-b border-gray-800 hover:bg-[#2a2a2a] transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-transparent to-purple-900/10' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">
                      {index + 1}
                    </span>
                    {index < 3 && (
                      <span className="text-2xl">{getMedalEmoji(index + 1)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white font-mono text-sm">
                    {formatAddress(entry.playerAddress)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-yellow-400 font-bold">
                    {entry.firstPlaceCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-gray-300 font-bold">
                    {entry.secondPlaceCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-orange-400 font-bold">
                    {entry.thirdPlaceCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-white font-bold">
                    {entry.totalWins}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-gray-400">
                    {entry.tournamentsParticipated}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-green-400 font-bold">
                    {entry.totalPrizesWon} CKRA
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <Button
          onClick={fetchLeaderboard}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Refresh Leaderboard
        </Button>
      </div>
    </div>
  );
}


