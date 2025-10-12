"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { client } from "@/utils/constants/client";
import { Button } from "@/components/ui/button";
import { Tournament, BracketMatch } from "@/types/tournament";
import { CHARACTERS, Character } from "@/lib/characters";
import { checkChakraBalance } from "@/lib/tournamentPayment";
import { characterAdressess } from "@/lib/charater-address";
import { toast } from "react-toastify";
import TournamentBracket from "@/components/TournamentBracket";

interface PageProps {
  params: Promise<{ id: string }>;
}

export type PartialCharacter = {
  address: string;
  source?: {
    params?: {
      attributes?: Record<string, string>;
    };
  };
};

export default function TournamentDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  
  // Unwrap params promise
  const { id: tournamentId } = use(params);
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
  const [claimingPrize, setClaimingPrize] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (connected && publicKey && tournament) {
      fetchBalance();
    }
  }, [connected, publicKey, tournament]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserCharacters();
    }
  }, [connected, publicKey]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await response.json();

      if (data.success) {
        setTournament(data.tournament);
      } else {
        setError(data.error || "Tournament not found");
      }
    } catch (err) {
      setError(`Failed to load tournament: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!publicKey || !tournament) return;

    const result = await checkChakraBalance(
      publicKey.toString(),
      tournament.entryFee
    );

    if (result.balance !== undefined) {
      setBalance(result.balance);
    }
  };

  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");

  function getCharacterId(attributes: Record<string, string>) {
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  const fetchUserCharacters = async () => {
    if (!publicKey) return;
    try {
      const treeAddresses = Array.from(
        new Set(characterAdressess.map((c) => c.treeAdress))
      );

      const { character } = await client.findCharacters({
        trees: treeAddresses,
        includeProof: true,
        wallets: [publicKey.toString()],
      });

      const matchedAbilities = (character as PartialCharacter[])
        .map((c) => {
          const id = getCharacterId(c.source?.params?.attributes ?? {});
          const foundCharacter = CHARACTERS.find((char) => char.id === id);

          if (foundCharacter) {
            return {
              ...foundCharacter,
              address: c.address,
            };
          }
          return undefined;
        })
        .filter(Boolean) as Character[];

      setCharacterAbilities(matchedAbilities);
    } catch (error) {
      toast.error(`Error fetching characters: ${error}`);
    }
  };

  const handleJoinTournament = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!selectedCharacter) {
      setError("Please select a character");
      return;
    }

    if (!tournament) return;

    // Check if already joined
    const alreadyJoined = tournament.participants.some(
      (p) => p.address === publicKey.toString()
    );

    if (alreadyJoined) {
      setError("You have already joined this tournament");
      return;
    }

    const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY;
    const isAdmin = publicKey.toString() === PROJECT_AUTHORITY;

    // Check balance (skip for admin during testing)
    if (!isAdmin && balance !== null && balance < tournament.entryFee) {
      setError(`Insufficient chakra. You need ${tournament.entryFee} but have ${balance}`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      let signature;

      // Admin wallet bypasses payment (for testing purposes)
      if (isAdmin) {
        console.log("Admin wallet joining - skipping payment");
        signature = "admin-bypass-" + Date.now(); // Dummy signature for admin
      } else {
        // Regular users: Create and send transfer transaction with retry logic
        let response;
        let retries = 5;
        let attempt = 1;
        
        while (retries > 0) {
          try {
            if (attempt > 1) {
              // Show user we're retrying
              setError(`Retrying payment (attempt ${attempt}/5)... Please wait.`);
              // Wait longer for merkle tree to settle (5 seconds)
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            // Create fresh transaction each attempt (avoids stale merkle tree proofs)
            const { createTransferResourceTransaction: txResponse } = 
              await client.createTransferResourceTransaction({
                resource: process.env.CHAKRA_RESOURCE_ADDRESS as string,
                owner: publicKey.toString(),
                recipient: PROJECT_AUTHORITY as string,
                amount: tournament.entryFee.toString(),
                // No payer specified = owner pays gas fees
              });

            // User signs and sends the transaction
            response = await sendClientTransactions(client, wallet, txResponse);
            
            console.log(`Tournament payment response (attempt ${attempt}):`, response);
            
            if (response && response[0]?.responses && response[0].responses[0]?.status === "Success") {
              signature = response[0].responses[0].signature;
              setError(null); // Clear retry message
              break; // Success! Exit retry loop
            }
            
            // Check if it's a merkle tree error
            const error = response?.[0]?.responses?.[0]?.error;
            if (error && (error.includes("concurrent merkle tree") || error.includes("0x1771"))) {
              console.log(`Merkle tree conflict, retrying... (${retries - 1} attempts left)`);
              retries--;
              attempt++;
              continue; // Try again after wait in next iteration
            }
            
            throw new Error(error || "Payment transaction failed");
            
          } catch (txError) {
            if (retries > 1 && txError instanceof Error && 
                (txError.message.includes("merkle tree") || txError.message.includes("0x1771"))) {
              console.log(`Merkle tree error, retrying... (${retries - 1} attempts left)`);
              retries--;
              attempt++;
              continue;
            }
            throw txError;
          }
        }
        
        if (!signature) {
          throw new Error("Payment failed after 5 attempts. The merkle tree is busy. Please wait 30 seconds and try again.");
        }
      }

      // Step 3: Join tournament with transaction signature
      if (!selectedCharacter || !selectedCharacter.address) {
        throw new Error("Character address not found. Please select a character you own.");
      }

      const joinPayload = {
        tournamentId: tournament.id,
        participantAddress: publicKey.toString(),
        characterId: selectedCharacter.id,
        characterAddress: selectedCharacter.address,
        transactionSignature: signature,
      };

      console.log("Joining tournament with payload:", joinPayload);

      const joinResponse = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const joinData = await joinResponse.json();

      if (!joinResponse.ok || !joinData.success) {
        throw new Error(joinData.error || "Failed to join tournament");
      }

      // Refresh tournament data
      await fetchTournament();
      setSelectedCharacter(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setJoining(false);
    }
  };

  const handleJoinMatch = async (match: BracketMatch): Promise<void> => {
    if (!publicKey || !tournament || !match.roomId) return;

    try {
      // Validate player is in this match
      if (match.player1?.address !== publicKey.toString() && 
          match.player2?.address !== publicKey.toString()) {
        toast.error("You are not a participant in this match");
        return;
      }

      toast.success("Joining match...");
      
      // Redirect to existing game room
      router.push(`/game-play/${match.roomId}`);
      
    } catch (error) {
      console.error("Failed to join match:", error);
      toast.error(`Failed to join match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClaimPrize = async (): Promise<void> => {
    if (!publicKey || !tournament) return;

    setClaimingPrize(true);
    try {
      console.log("💰 Claiming tournament prize...");
      
      const response = await fetch('/api/tournaments/claim-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          playerAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to claim prize");
      }

      toast.success(`💰 Prize claimed! ${data.prize.amount} CKRA transferred to your wallet!`, {
        autoClose: 5000,
      });
      
      // Refresh tournament to update claimed status
      await fetchTournament();
      
    } catch (error) {
      console.error("Failed to claim prize:", error);
      toast.error(`Failed to claim prize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClaimingPrize(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading tournament...</div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-red-500/30 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
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

  if (!tournament) return null;

  const canJoin = tournament.status === "open" && 
                  tournament.currentParticipants < tournament.maxParticipants &&
                  !tournament.participants.some(p => p.address === publicKey?.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/tournaments")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mb-4"
          >
            ← Back to Tournaments
          </Button>
        </div>

        {/* Winners & Prize Claiming - Show if completed */}
        {tournament.status === 'completed' && tournament.prizeDistribution && tournament.prizeDistribution.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-yellow-900/30 to-purple-900/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🏆 Tournament Winners
              </h2>
              <div className="space-y-3">
                {tournament.prizeDistribution.map((prize, index) => {
                  const isCurrentPlayer = prize.address === publicKey?.toString();
                  const positionEmoji = ['🥇', '🥈', '🥉', '🏅', '🏅'][index] || '🏅';
                  
                  return (
                    <div
                      key={prize.address}
                      className={`bg-gray-900/50 rounded-lg p-5 border-2 ${
                        isCurrentPlayer 
                          ? 'border-green-500 ring-2 ring-green-500/50' 
                          : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{positionEmoji}</span>
                          <div>
                            <p className="text-white font-bold text-lg">
                              {prize.position} Place
                              {isCurrentPlayer && <span className="text-green-400 ml-2">← You!</span>}
                            </p>
                            <p className="text-gray-400 text-sm font-mono">
                              {prize.address.slice(0, 8)}...{prize.address.slice(-6)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-yellow-400 text-2xl font-bold">
                              {prize.amount} 💎
                            </p>
                            {prize.claimed ? (
                              <p className="text-green-400 text-sm flex items-center gap-1 justify-end">
                                ✅ Claimed
                              </p>
                            ) : (
                              <p className="text-gray-400 text-sm">
                                Not claimed yet
                              </p>
                            )}
                          </div>
                          
                          {isCurrentPlayer && !prize.claimed && (
                            <Button
                              onClick={handleClaimPrize}
                              disabled={claimingPrize}
                              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-bold"
                            >
                              {claimingPrize ? "Claiming..." : "💰 Claim Prize"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tournament Bracket - Show if in progress or completed */}
        {(tournament.status === 'in_progress' || tournament.status === 'completed') && tournament.bracket && (
          <div className="mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Tournament Bracket
              </h2>
              <TournamentBracket
                bracket={tournament.bracket}
                currentPlayerAddress={publicKey?.toString()}
                onStartMatch={handleJoinMatch}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                {tournament.name}
              </h1>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 mb-1">Entry Fee</p>
                  <p className="text-yellow-400 text-2xl font-bold">
                    {tournament.entryFee} 💎
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Prize Pool</p>
                  <p className="text-green-400 text-2xl font-bold">
                    {tournament.prizePool} 💎
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Players</p>
                  <p className="text-white text-2xl font-bold">
                    {tournament.currentParticipants}/{tournament.maxParticipants}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <p className="text-purple-400 text-2xl font-bold capitalize">
                    {tournament.status.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                  style={{
                    width: `${
                      (tournament.currentParticipants / tournament.maxParticipants) * 100
                    }%`,
                  }}
                />
              </div>

              {/* Prize Distribution */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">
                  Prize Distribution ({tournament.numberOfWinners} {tournament.numberOfWinners === 1 ? 'Winner' : 'Winners'})
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">🥇 1st Place</span>
                    <span className="text-green-400 font-bold">
                      {tournament.prizeSplit.first}% ({((tournament.prizePool * tournament.prizeSplit.first) / 100).toFixed(0)} 💎)
                    </span>
                  </div>
                  {tournament.numberOfWinners >= 2 && tournament.prizeSplit.second && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">🥈 2nd Place</span>
                      <span className="text-blue-400 font-bold">
                        {tournament.prizeSplit.second}% ({((tournament.prizePool * tournament.prizeSplit.second) / 100).toFixed(0)} 💎)
                      </span>
                    </div>
                  )}
                  {tournament.numberOfWinners >= 3 && tournament.prizeSplit.third && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">🥉 3rd Place</span>
                      <span className="text-yellow-400 font-bold">
                        {tournament.prizeSplit.third}% ({((tournament.prizePool * tournament.prizeSplit.third) / 100).toFixed(0)} 💎)
                      </span>
                    </div>
                  )}
                  {tournament.numberOfWinners >= 4 && tournament.prizeSplit.fourth && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">🏅 4th Place</span>
                      <span className="text-orange-400 font-bold">
                        {tournament.prizeSplit.fourth}% ({((tournament.prizePool * tournament.prizeSplit.fourth) / 100).toFixed(0)} 💎)
                      </span>
                    </div>
                  )}
                  {tournament.numberOfWinners >= 5 && tournament.prizeSplit.fifth && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">🏅 5th Place</span>
                      <span className="text-pink-400 font-bold">
                        {tournament.prizeSplit.fifth}% ({((tournament.prizePool * tournament.prizeSplit.fifth) / 100).toFixed(0)} 💎)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {tournament.description && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">Description</h3>
                  <p className="text-gray-300">{tournament.description}</p>
                </div>
              )}
            </div>

            {/* Participants List */}
            <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Participants ({tournament.currentParticipants})
              </h2>
              
              {tournament.participants.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No participants yet. Be the first to join!
                </p>
              ) : (
                <div className="space-y-3">
                  {tournament.participants.map((participant, index) => (
                    <div
                      key={participant.address}
                      className="bg-gray-900/50 rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="text-purple-400 font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {participant.nickname}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {participant.village} • {participant.address.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Join Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Join Tournament
              </h2>

              {!connected ? (
                <p className="text-yellow-400 mb-4">
                  Connect your wallet to join
                </p>
              ) : balance !== null ? (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Your Chakra Balance</p>
                  <p className={`text-xl font-bold ${balance >= tournament.entryFee ? 'text-green-400' : 'text-red-400'}`}>
                    {balance} 💎
                  </p>
                </div>
              ) : null}

              {canJoin && connected && (
                <>
                  <div className="mb-4">
                    <Label className="text-white mb-2 block">Select Your Character</Label>
                    {characterAbilities.length === 0 ? (
                      <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 text-center">
                        <p className="text-yellow-400 text-sm">
                          No characters found. Please mint a character first.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                        {characterAbilities.map((char) => (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => setSelectedCharacter(char)}
                            className={`p-3 rounded-lg text-left transition-all ${
                              selectedCharacter?.id === char.id
                                ? "bg-purple-600 border-2 border-purple-400"
                                : "bg-gray-700 border-2 border-gray-600 hover:bg-gray-600"
                            }`}
                          >
                            <p className="text-white font-semibold text-sm">
                              {char.nickname}
                            </p>
                            <p className="text-gray-300 text-xs">
                              {char.village}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleJoinTournament}
                    disabled={joining || !selectedCharacter}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 text-lg font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? "Joining..." : 
                     publicKey?.toString() === process.env.PROJECT_AUTHORITY 
                       ? "Join Free (Admin Testing)" 
                       : `Pay ${tournament.entryFee} 💎 & Join`}
                  </Button>
                  
                  {publicKey?.toString() === process.env.PROJECT_AUTHORITY && (
                    <p className="text-yellow-400 text-xs mt-2 text-center">
                      🔧 Admin bypass: Join without payment (testing only)
                    </p>
                  )}
                </>
              )}

              {tournament.participants.some(p => p.address === publicKey?.toString()) && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                  <p className="text-green-400 font-semibold text-center">
                    ✓ You&apos;re registered!
                  </p>
                </div>
              )}

              {tournament.status !== "open" && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-300 text-center">
                    Tournament is {tournament.status.replace("_", " ")}
                  </p>
                </div>
              )}

              {tournament.currentParticipants >= tournament.maxParticipants && tournament.status === "open" && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-400 text-center">
                    Tournament is full
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

