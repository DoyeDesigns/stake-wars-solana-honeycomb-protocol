"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { client } from "@/utils/constants/client";
import { Button } from "@/components/ui/button";
import { WagerGame } from "@/types/wager";
import { CHARACTERS, Character } from "@/lib/characters";
import { characterAdressess } from "@/lib/charater-address";
import { toast } from "react-toastify";
import { checkChakraBalance } from "@/lib/tournamentPayment";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export type PartialCharacter = {
  address: string;
  source?: {
    params?: {
      attributes?: Record<string, string>;
    };
  };
};

export default function WagerPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const [openWagers, setOpenWagers] = useState<WagerGame[]>([]);
  const [myWagers, setMyWagers] = useState<WagerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wagerAmount, setWagerAmount] = useState<number>(10);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'my'>('open');

  useEffect(() => {
    fetchOpenWagers();
    if (connected && publicKey) {
      fetchMyWagers();
      fetchUserCharacters();
      fetchBalance();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    const result = await checkChakraBalance(publicKey.toString(), 0);
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
      console.log("🔍 Fetching characters for wallet:", publicKey.toString());
      
      const treeAddresses = Array.from(
        new Set(characterAdressess.map((c) => c.treeAdress))
      );

      console.log("📦 Searching in tree addresses:", treeAddresses);

      const { character } = await client.findCharacters({
        trees: treeAddresses,
        includeProof: true,
        wallets: [publicKey.toString()],  // Only get characters owned by this wallet
      });

      console.log("✅ Raw characters found:", character?.length || 0);
      console.log("Character data:", character);

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

      console.log("🎮 Matched characters with abilities:", matchedAbilities.length);
      console.log("Your characters:", matchedAbilities.map(c => `${c.nickname} (${c.id})`));

      setCharacterAbilities(matchedAbilities);
      
      if (matchedAbilities.length === 0) {
        console.warn("⚠️ No characters found for this wallet. User needs to mint characters.");
      }
    } catch (error) {
      console.error("❌ Error fetching characters:", error);
      toast.error(`Error fetching characters: ${error}`);
    }
  };

  const fetchOpenWagers = async () => {
    try {
      setLoading(true);
      console.log("Fetching open wagers...");
      const response = await fetch('/api/wager/list?status=open');
      const data = await response.json();

      console.log("Open wagers response:", data);

      if (data.success) {
        setOpenWagers(data.wagerGames);
        console.log(`Loaded ${data.wagerGames.length} open wagers`);
      } else {
        console.error("Failed to fetch open wagers:", data.error);
        toast.error(`Failed to load wagers: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching open wagers:", error);
      toast.error(`Error loading wagers: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyWagers = async () => {
    if (!publicKey) return;
    try {
      console.log("Fetching my wagers for:", publicKey.toString());
      const response = await fetch(`/api/wager/list?player=${publicKey.toString()}`);
      const data = await response.json();

      console.log("My wagers response:", data);

      if (data.success) {
        setMyWagers(data.wagerGames);
        console.log(`Loaded ${data.wagerGames.length} my wagers`);
      } else {
        console.error("Failed to fetch my wagers:", data.error);
        toast.error(`Failed to load your wagers: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching my wagers:", error);
      toast.error(`Error loading your wagers: ${error}`);
    }
  };

  const handleCreateWager = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!selectedCharacter || !selectedCharacter.address) {
      toast.error("Please select a character you own");
      return;
    }

    if (wagerAmount <= 0) {
      toast.error("Wager amount must be greater than 0");
      return;
    }

    if (balance !== null && balance < wagerAmount) {
      toast.error(`Insufficient balance. You have ${balance} CKRA, need ${wagerAmount}`);
      return;
    }

    setCreating(true);
    try {
      // Check if admin bypass (for testing)
      const isAdmin = publicKey.toString() === process.env.PROJECT_AUTHORITY;
      let signature: string;

      if (isAdmin) {
        signature = `admin-bypass-${Date.now()}`;
        console.log("Admin bypass - skipping payment");
      } else {
        // Create payment transaction (matching tournament pattern)
        const { createTransferResourceTransaction: txResponse } = await client.createTransferResourceTransaction({
          resource: process.env.CHAKRA_RESOURCE_ADDRESS as string,
          owner: publicKey.toString(),
          recipient: process.env.PROJECT_AUTHORITY as string,
          amount: wagerAmount.toString(),
        });

        // User signs the transfer
        const response = await sendClientTransactions(
          client,
          wallet,
          txResponse
        );

        console.log("Wager payment response:", response);

        if (!response || response.length === 0 || !response[0]?.responses?.[0]?.signature) {
          throw new Error("Payment transaction failed");
        }

        signature = response[0].responses[0].signature;
      }

      // Create wager game
      console.log("Creating wager with data:", {
        creatorAddress: publicKey.toString(),
        characterId: selectedCharacter.id,
        characterAddress: selectedCharacter.address,
        wagerAmount,
        transactionSignature: signature,
      });

      const createResponse = await fetch('/api/wager/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: publicKey.toString(),
          characterId: selectedCharacter.id,
          characterAddress: selectedCharacter.address,
          wagerAmount,
          transactionSignature: signature,
        }),
      });

      const createData = await createResponse.json();
      console.log("Create wager response:", createData);

      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.error || "Failed to create wager game");
      }

      toast.success(`Wager game created! ID: ${createData.wagerGame.id}`);
      setShowCreateModal(false);
      setSelectedCharacter(null);
      setWagerAmount(10);
      
      console.log("Refreshing wager lists...");
      await fetchOpenWagers();
      if (publicKey) {
        await fetchMyWagers();
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create wager");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWager = async (wager: WagerGame) => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!selectedCharacter || !selectedCharacter.address) {
      toast.error("Please select a character you own");
      return;
    }

    if (wager.creatorAddress === publicKey.toString()) {
      toast.error("Cannot join your own wager");
      return;
    }

    if (balance !== null && balance < wager.wagerAmount) {
      toast.error(`Insufficient balance. You have ${balance} CKRA, need ${wager.wagerAmount}`);
      return;
    }

    setJoining(true);
    try {
      // Check if admin bypass (for testing)
      const isAdmin = publicKey.toString() === process.env.PROJECT_AUTHORITY;
      let signature: string;

      if (isAdmin) {
        signature = `admin-bypass-${Date.now()}`;
        console.log("Admin bypass - skipping payment");
      } else {
        // Create payment transaction (matching tournament pattern)
        const { createTransferResourceTransaction: txResponse } = await client.createTransferResourceTransaction({
          resource: process.env.CHAKRA_RESOURCE_ADDRESS as string,
          owner: publicKey.toString(),
          recipient: process.env.PROJECT_AUTHORITY as string,
          amount: wager.wagerAmount.toString(),
        });

        // User signs the transfer
        const response = await sendClientTransactions(
          client,
          wallet,
          txResponse
        );

        console.log("Join wager payment response:", response);

        if (!response || response.length === 0 || !response[0]?.responses?.[0]?.signature) {
          throw new Error("Payment transaction failed");
        }

        signature = response[0].responses[0].signature;
      }

      // Join wager game
      const joinResponse = await fetch('/api/wager/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerId: wager.id,
          challengerAddress: publicKey.toString(),
          characterId: selectedCharacter.id,
          characterAddress: selectedCharacter.address,
          transactionSignature: signature,
        }),
      });

      const joinData = await joinResponse.json();

      if (!joinResponse.ok || !joinData.success) {
        throw new Error(joinData.error || "Failed to join wager game");
      }

      toast.success("Joined wager! Creating game room...");

      // Create game room for the wager match
      const gameRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const gameRoomRef = doc(db, "gameRooms", gameRoomId);
      
      await setDoc(gameRoomRef, {
        id: gameRoomId,
        createdBy: wager.creatorAddress,
        createdAt: Date.now(),
        status: "character-select",
        isWagerMatch: true,
        wagerId: wager.id,
        wagerAmount: wager.wagerAmount,
        players: {
          [wager.creatorAddress]: {
            wallet: wager.creatorAddress,
            role: "creator",
            characterId: wager.creatorCharacterId,
            diceRoll: null,
          },
          [publicKey.toString()]: {
            wallet: publicKey.toString(),
            role: "challenger",
            characterId: selectedCharacter.id,
            diceRoll: null,
          },
        },
        gameState: {
          gameStatus: "character-select",
          currentTurn: null,
          turnCount: 0,
          player1: {
            id: wager.creatorAddress,
            character: CHARACTERS.find(c => c.id === wager.creatorCharacterId),
            currentHealth: CHARACTERS.find(c => c.id === wager.creatorCharacterId)?.baseHealth || 200,
            maxHealth: CHARACTERS.find(c => c.id === wager.creatorCharacterId)?.baseHealth || 200,
            defenseInventory: {},
            buffs: [],
          },
          player2: {
            id: publicKey.toString(),
            character: selectedCharacter,
            currentHealth: selectedCharacter.baseHealth,
            maxHealth: selectedCharacter.baseHealth,
            defenseInventory: {},
            buffs: [],
          },
          diceRolls: {},
          gameHistory: [],
        },
      });

      // Link game room to wager
      await fetch('/api/wager/link-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerId: wager.id,
          gameRoomId,
        }),
      });

      // Redirect to game
      router.push(`/game-play/${gameRoomId}`);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join wager");
      console.error(error);
    } finally {
      setJoining(false);
    }
  };

  if (loading && activeTab === 'open') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading wager games...</div>
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
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                💰 Wager Matches
              </h1>
              <p className="text-gray-300">
                Stake CKRA and battle for winner-takes-all!
              </p>
            </div>
            
            {connected && (
              <div className="text-right">
                <p className="text-gray-400 text-sm">Your Balance</p>
                <p className="text-2xl font-bold text-green-400">
                  {balance !== null ? `${balance} 💎` : "Loading..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Wager Button */}
        {connected && (
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold rounded-xl"
            >
              + Create Wager Match
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'open'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Open Wagers ({openWagers.length})
          </button>
          {connected && (
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'my'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              My Wagers ({myWagers.length})
            </button>
          )}
        </div>

        {/* Character Selection - Top Bar (Show on Open Wagers tab) */}
        {connected && characterAbilities.length > 0 && activeTab === 'open' && (
          <div className="mb-6 bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-bold">
                  {selectedCharacter ? `Selected: ${selectedCharacter.nickname}` : 'Select Your Character to Join Wagers'}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Choose a character to accept challenges
                </p>
              </div>
              {selectedCharacter && (
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {characterAbilities.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedCharacter?.id === char.id
                      ? "bg-purple-600 border-2 border-purple-400 scale-105 shadow-lg"
                      : "bg-gray-700 border-2 border-gray-600 hover:bg-gray-600 hover:scale-102"
                  }`}
                >
                  <p className="text-white font-semibold text-sm truncate">{char.nickname}</p>
                  <p className="text-gray-300 text-xs truncate">{char.village}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Characters Warning */}
        {connected && characterAbilities.length === 0 && activeTab === 'open' && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-xl p-4">
            <p className="text-red-400 font-semibold">
              ⚠️ No characters found. Please mint a character first to join wagers.
            </p>
          </div>
        )}

        {/* Wager List */}
        <div className="space-y-4">
          {activeTab === 'open' ? (
            openWagers.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-12 text-center">
                <p className="text-gray-400 text-lg">
                  No open wagers available. Be the first to create one!
                </p>
              </div>
            ) : (
              openWagers.map((wager) => {
                const character = CHARACTERS.find(c => c.id === wager.creatorCharacterId);
                return (
                  <div
                    key={wager.id}
                    className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-2xl">⚔️</span>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {character?.nickname || "Unknown"} vs ???
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {character?.village} • {wager.creatorAddress.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-4">
                          <div>
                            <p className="text-gray-400 text-sm">Wager Amount</p>
                            <p className="text-yellow-400 text-xl font-bold">
                              {wager.wagerAmount} 💎
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Prize Pool</p>
                            <p className="text-green-400 text-xl font-bold">
                              {wager.wagerAmount * 2} 💎
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Created</p>
                            <p className="text-gray-300 text-sm">
                              {new Date(wager.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {connected && wager.creatorAddress !== publicKey?.toString() ? (
                        <div className="flex flex-col items-end gap-2">
                          {!selectedCharacter && (
                            <p className="text-yellow-400 text-xs">
                              ⚠️ Select a character above
                            </p>
                          )}
                          <Button
                            onClick={() => handleJoinWager(wager)}
                            disabled={joining || !selectedCharacter}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {joining ? "Joining..." : "Accept Challenge"}
                          </Button>
                        </div>
                      ) : wager.creatorAddress === publicKey?.toString() ? (
                        <div className="bg-blue-500/20 border border-blue-500 rounded-lg px-4 py-2">
                          <p className="text-blue-400 text-sm font-semibold">
                            Your Wager
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            myWagers.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-12 text-center">
                <p className="text-gray-400 text-lg">
                  You haven&apos;t created or joined any wagers yet.
                </p>
              </div>
            ) : (
              myWagers.map((wager) => {
                const creatorChar = CHARACTERS.find(c => c.id === wager.creatorCharacterId);
                const challengerChar = wager.challengerCharacterId 
                  ? CHARACTERS.find(c => c.id === wager.challengerCharacterId)
                  : null;
                
                const isCreator = wager.creatorAddress === publicKey?.toString();
                
                return (
                  <div
                    key={wager.id}
                    className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-2xl">
                            {wager.status === 'completed' ? '🏆' : '⚔️'}
                          </span>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {creatorChar?.nickname} vs {challengerChar?.nickname || "Waiting..."}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {isCreator ? "You created this match" : "You joined this match"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-4">
                          <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className="text-purple-400 font-bold capitalize">
                              {wager.status.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Prize Pool</p>
                            <p className="text-green-400 text-xl font-bold">
                              {wager.wagerAmount * (wager.challengerAddress ? 2 : 1)} 💎
                            </p>
                          </div>
                          {wager.winnerId && (
                            <div>
                              <p className="text-gray-400 text-sm">Winner</p>
                              <p className="text-yellow-400 font-bold">
                                {wager.winnerId === publicKey?.toString() ? "You! 🎉" : "Opponent"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Join Game Button */}
                      {wager.status === 'in_progress' && wager.gameRoomId && (
                        <div className="ml-4">
                          <Button
                            onClick={() => router.push(`/game-play/${wager.gameRoomId}`)}
                            className="bg-[#34681C] hover:bg-[#34681C]/80 text-white px-6 py-3 rounded-lg font-bold"
                          >
                            Join Game
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Create Wager Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Create Wager Match</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-white mb-2 block">Wager Amount (CKRA)</label>
                  <input
                    type="number"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-lg px-4 py-3 focus:border-purple-500 outline-none"
                    placeholder="Enter amount"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Winner gets: {wagerAmount * 2} CKRA
                  </p>
                </div>

                {!selectedCharacter && (
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Please select a character above before creating a wager
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWager}
                  disabled={creating || !selectedCharacter || wagerAmount <= 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Pay"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

