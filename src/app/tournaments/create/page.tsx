"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateTournamentRequest, TournamentSize, PrizeSplit } from "@/types/tournament";

export default function CreateTournamentPage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  
  const [formData, setFormData] = useState({
    name: "",
    entryFee: 10,
    maxParticipants: 8 as TournamentSize,
    description: "",
    first: 60,
    second: 30,
    third: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setError("Tournament name is required");
      return;
    }

    if (formData.entryFee <= 0) {
      setError("Entry fee must be greater than 0");
      return;
    }

    const totalPercentage = formData.first + formData.second + formData.third;
    if (totalPercentage !== 100) {
      setError("Prize split percentages must add up to 100%");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prizeSplit: PrizeSplit = {
        first: formData.first,
        second: formData.second,
        third: formData.third,
      };

      const requestBody: CreateTournamentRequest = {
        name: formData.name.trim(),
        entryFee: formData.entryFee,
        maxParticipants: formData.maxParticipants,
        prizeSplit,
        description: formData.description.trim(),
        hostAddress: publicKey.toString(),
      };

      const response = await fetch("/api/tournaments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create tournament");
      }

      // Redirect to tournament page
      router.push(`/tournaments/${data.tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to create a tournament
          </p>
          <Button
            onClick={() => router.push("/tournaments")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/tournaments")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mb-4"
          >
            ← Back to Tournaments
          </Button>
          <h1 className="text-5xl font-bold text-white mb-2">
            Create Tournament
          </h1>
          <p className="text-gray-300 text-lg">
            Set up your own chakra prize tournament
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 space-y-6">
            {/* Tournament Name */}
            <div>
              <Label htmlFor="name" className="text-white text-lg mb-2 block">
                Tournament Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Epic Ninja Championship"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            {/* Entry Fee */}
            <div>
              <Label htmlFor="entryFee" className="text-white text-lg mb-2 block">
                Entry Fee (Chakra) *
              </Label>
              <Input
                id="entryFee"
                type="number"
                min="1"
                value={formData.entryFee}
                onChange={(e) =>
                  handleInputChange("entryFee", parseInt(e.target.value) || 1)
                }
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              <p className="text-gray-400 text-sm mt-1">
                Prize pool: {formData.entryFee * formData.maxParticipants} 💎
              </p>
            </div>

            {/* Max Participants */}
            <div>
              <Label className="text-white text-lg mb-2 block">
                Tournament Size *
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {[8, 16, 32].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      handleInputChange("maxParticipants", size as TournamentSize)
                    }
                    className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                      formData.maxParticipants === size
                        ? "bg-purple-600 text-white border-2 border-purple-400"
                        : "bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600"
                    }`}
                  >
                    {size} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Prize Split */}
            <div>
              <Label className="text-white text-lg mb-3 block">
                Prize Distribution *
              </Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="first" className="text-gray-300 w-24">
                    🥇 1st Place
                  </Label>
                  <Input
                    id="first"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.first}
                    onChange={(e) =>
                      handleInputChange("first", parseInt(e.target.value) || 0)
                    }
                    className="bg-gray-700 border-gray-600 text-white w-20"
                  />
                  <span className="text-white">%</span>
                  <span className="text-green-400 font-semibold ml-auto">
                    {((formData.entryFee * formData.maxParticipants * formData.first) / 100).toFixed(0)} 💎
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Label htmlFor="second" className="text-gray-300 w-24">
                    🥈 2nd Place
                  </Label>
                  <Input
                    id="second"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.second}
                    onChange={(e) =>
                      handleInputChange("second", parseInt(e.target.value) || 0)
                    }
                    className="bg-gray-700 border-gray-600 text-white w-20"
                  />
                  <span className="text-white">%</span>
                  <span className="text-blue-400 font-semibold ml-auto">
                    {((formData.entryFee * formData.maxParticipants * formData.second) / 100).toFixed(0)} 💎
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Label htmlFor="third" className="text-gray-300 w-24">
                    🥉 3rd Place
                  </Label>
                  <Input
                    id="third"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.third}
                    onChange={(e) =>
                      handleInputChange("third", parseInt(e.target.value) || 0)
                    }
                    className="bg-gray-700 border-gray-600 text-white w-20"
                  />
                  <span className="text-white">%</span>
                  <span className="text-yellow-400 font-semibold ml-auto">
                    {((formData.entryFee * formData.maxParticipants * formData.third) / 100).toFixed(0)} 💎
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total:</span>
                    <span
                      className={`font-semibold ${
                        formData.first + formData.second + formData.third === 100
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formData.first + formData.second + formData.third}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white text-lg mb-2 block">
                Description (Optional)
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Add tournament rules, special conditions, or other details..."
                className="w-full bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-400 rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-xl font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Tournament..." : "Create Tournament"}
          </Button>
        </form>
      </div>
    </div>
  );
}


