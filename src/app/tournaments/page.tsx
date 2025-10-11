"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tournament, TournamentStatus } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

export default function TournamentsPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TournamentStatus | "all">("all");

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const url = filter === "all" 
        ? "/api/tournaments/list"
        : `/api/tournaments/list?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case "open":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">
              StakeWars Tournaments
            </h1>
            <p className="text-gray-300 text-lg">
              Compete for chakra prizes in epic ninja battles
            </p>
          </div>
          
          {connected ? (
            <Button
              onClick={() => router.push("/tournaments/create")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg"
            >
              Create Tournament
            </Button>
          ) : (
            <div className="text-yellow-400 text-sm">
              Connect wallet to create tournaments
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {["all", "open", "in_progress", "completed"].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status as TournamentStatus | "all")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === status
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
            </Button>
          ))}
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center text-white text-xl py-20">
            Loading tournaments...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-4">
              No tournaments found
            </p>
            {connected && (
              <Button
                onClick={() => router.push("/tournaments/create")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg"
              >
                Create the First Tournament
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="block"
              >
                <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer">
                  {/* Tournament Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white line-clamp-1">
                      {tournament.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        tournament.status
                      )}`}
                    >
                      {tournament.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Tournament Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-yellow-400 font-bold text-lg">
                        {tournament.entryFee} 💎
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Prize Pool:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {tournament.prizePool} 💎
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white font-semibold">
                        {tournament.currentParticipants}/{tournament.maxParticipants}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                        style={{
                          width: `${
                            (tournament.currentParticipants /
                              tournament.maxParticipants) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Host:</span>
                      <span className="text-gray-300 text-sm font-medium">
                        {tournament.hostName || "Anonymous"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {tournament.description && (
                    <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


