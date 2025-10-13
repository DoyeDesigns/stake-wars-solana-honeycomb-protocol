"use client";

import React from "react";
import { BracketMatch, BracketRound } from "@/types/tournament";
import { Button } from "@/components/ui/button";

interface TournamentBracketProps {
  bracket: BracketMatch[];
  currentPlayerAddress?: string;
  onStartMatch?: (match: BracketMatch) => void;
  isHost?: boolean;
}

const ROUND_NAMES: Record<BracketRound, string> = {
  'round_of_32': 'Round of 32',
  'round_of_16': 'Round of 16',
  'quarterfinals': 'Quarterfinals',
  'semifinals': 'Semifinals',
  'finals': 'Finals',
  'third_place': '3rd Place Match',
};

const ROUND_ORDER: BracketRound[] = [
  'round_of_32',
  'round_of_16',
  'quarterfinals',
  'semifinals',
  'third_place',
  'finals',
];

export default function TournamentBracket({
  bracket,
  currentPlayerAddress,
  onStartMatch,
}: TournamentBracketProps) {
  // Group matches by round
  const matchesByRound: Record<BracketRound, BracketMatch[]> = {
    'round_of_32': [],
    'round_of_16': [],
    'quarterfinals': [],
    'semifinals': [],
    'finals': [],
    'third_place': [],
  };

  bracket.forEach(match => {
    matchesByRound[match.round].push(match);
  });

  // Sort matches within each round by position
  Object.keys(matchesByRound).forEach(round => {
    matchesByRound[round as BracketRound].sort((a, b) => a.position - b.position);
  });

  // Get only rounds that have matches
  const activeRounds = ROUND_ORDER.filter(
    round => matchesByRound[round].length > 0
  );

  const getPlayerName = (player: BracketMatch['player1']): string => {
    if (!player) return 'TBD';
    return player.nickname || player.address.slice(0, 6);
  };

  const isPlayerInMatch = (match: BracketMatch): boolean => {
    if (!currentPlayerAddress) return false;
    return (
      match.player1?.address === currentPlayerAddress ||
      match.player2?.address === currentPlayerAddress
    );
  };

  const canJoinMatch = (match: BracketMatch): boolean => {
    if (!match.player1 || !match.player2) return false;
    if (match.winner || match.completedAt) return false;
    if (!match.roomId) return false; // No room created yet
    return isPlayerInMatch(match);
  };

  const getMatchStatus = (match: BracketMatch): string => {
    if (match.winner) return 'Completed';
    if (match.roomId) return 'In Progress';
    if (match.player1 && match.player2) return 'Ready';
    return 'Waiting';
  };

  const getMatchStatusColor = (match: BracketMatch): string => {
    if (match.winner) return 'bg-green-500/20 border-green-500';
    if (match.roomId) return 'bg-yellow-500/20 border-yellow-500';
    if (match.player1 && match.player2) return 'bg-blue-500/20 border-blue-500';
    return 'bg-gray-500/20 border-gray-500';
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max p-4">
        {activeRounds.map((round, roundIndex) => (
          <div key={round} className="flex flex-col gap-4 min-w-[280px]">
            {/* Round Header */}
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-white">
                {ROUND_NAMES[round]}
              </h3>
              <p className="text-sm text-gray-400">
                {matchesByRound[round].length} match{matchesByRound[round].length !== 1 ? 'es' : ''}
              </p>
            </div>

            {/* Matches in this round */}
            <div className="flex flex-col gap-4 justify-around h-full">
              {matchesByRound[round].map((match, matchIndex) => (
                <div
                  key={match.matchId}
                  className={`border-2 rounded-lg p-4 ${getMatchStatusColor(match)} ${
                    isPlayerInMatch(match) ? 'ring-2 ring-purple-500' : ''
                  }`}
                  style={{
                    marginTop: roundIndex > 0 ? `${matchIndex * 20}px` : '0',
                  }}
                >
                  {/* Match Header */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-400">
                      Match {match.position}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {getMatchStatus(match)}
                    </span>
                  </div>

                  {/* Player 1 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded mb-2 ${
                      match.winner === match.player1?.address
                        ? 'bg-green-600/40 border border-green-500'
                        : 'bg-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {match.player1?.seedPosition || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {getPlayerName(match.player1)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {match.player1?.village || ''}
                        </p>
                      </div>
                    </div>
                    {match.winner === match.player1?.address && (
                      <span className="text-yellow-400 text-lg">👑</span>
                    )}
                  </div>

                  {/* VS Divider */}
                  <div className="text-center text-xs text-gray-500 font-bold my-1">
                    VS
                  </div>

                  {/* Player 2 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded ${
                      match.winner === match.player2?.address
                        ? 'bg-green-600/40 border border-green-500'
                        : 'bg-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {match.player2?.seedPosition || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {getPlayerName(match.player2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {match.player2?.village || ''}
                        </p>
                      </div>
                    </div>
                    {match.winner === match.player2?.address && (
                      <span className="text-yellow-400 text-lg">👑</span>
                    )}
                  </div>

                  {/* Action Button */}
                  {canJoinMatch(match) && onStartMatch && (
                    <Button
                      onClick={() => onStartMatch(match)}
                      className="w-full mt-3 bg-[#34681C] hover:bg-[#34681C]/80 text-white text-xs font-bold"
                    >
                      Join Game
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500/20 border-2 border-gray-500 rounded"></div>
          <span className="text-gray-400">Waiting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500/20 border-2 border-blue-500 rounded"></div>
          <span className="text-gray-400">Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500/20 border-2 border-yellow-500 rounded"></div>
          <span className="text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500 rounded"></div>
          <span className="text-gray-400">Completed</span>
        </div>
      </div>
    </div>
  );
}

