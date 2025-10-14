"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import { client } from '@/utils/constants/client';
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { Button } from './ui/button';
import { buffs } from '@/lib/buffs';
import useOnlineGameStore from '@/store/useOnlineGame';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/useUser';
import { CHARACTERS } from '@/lib/characters';
import { ShoppingCart } from 'lucide-react';
import { characterAdressess } from '@/lib/charater-address';

const CHAKRA_RESOURCE_TREE_ADDRESS = process.env.CHAKRA_RESOURCE_TREE_ADDRESS as string

export default function Marketplace() {
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>([]);
  const [purchasingCharacterId, setPurchasingCharacterId] = useState<string | null>(null);
    const wallet = useWallet();
    const { addBuffToPlayer, gameState, roomId } = useOnlineGameStore();
    const pathname = usePathname();
    const {refreshUser} = useUserStore();

    const currentPlayer = (() => {
      if (gameState?.gameStatus !== 'inProgress') return null;

      const isPlayer1 = gameState.player1?.id === wallet.publicKey?.toString();
      const isPlayer2 = gameState.player2?.id === wallet.publicKey?.toString();

      if (isPlayer1) return 'player1';
      if (isPlayer2) return 'player2';
      return null;
    })();

    const fetchResourcesBalance = async () => {
      if (!wallet.publicKey) {
        toast.error("Please connect wallet to view resources balance.");
        return
      }

      const resources = await client.findHoldings({
        holders: [wallet.publicKey?.toString() as string],
        trees: [CHAKRA_RESOURCE_TREE_ADDRESS]
      });

      setChakraBalance(Number(resources.holdings[0]?.balance));
    }

    const fetchOwnedCharacters = async () => {
      if (!wallet.publicKey) return;

      try {
        const { characterAdressess } = await import('@/lib/charater-address');
        const treeAddresses = Array.from(
          new Set(characterAdressess.map((c) => c.treeAdress))
        );

        const { character } = await client.findCharacters({
          trees: treeAddresses,
          wallets: [wallet.publicKey.toString()],
        });

        type PartialCharacter = {
          address: string;
          source?: {
            params?: {
              attributes?: Record<string, string>;
            };
          };
        };

        // Extract character IDs from attributes
        const ids = (character as PartialCharacter[]).map((char) => {
          const attributes = char.source?.params?.attributes;
          if (attributes && attributes.Village && attributes.Chakra) {
            const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
            return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
          }
          return null;
        }).filter(Boolean) as string[];

        setOwnedCharacterIds(ids);
      } catch (error) {
        console.error("Error fetching owned characters:", error);
      }
    }

    const purchasePowerUp = async (powerUp: { name: string; effect: number; remainingTurns: number; price: number; village: string; }) => {
        if (!wallet.publicKey) {
          toast.error("Wallet not connected!");
          return;
        }

        try {
           const burnResponse = await fetch("/api/burn-resource", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               amount: powerUp.price,
               walletAddress: wallet.publicKey.toString()
             }),
           });

          if (!burnResponse.ok) {
            const errorData = await burnResponse.json();
            toast.error(errorData.error || "Failed to burn resources");
            return;
          }

          const burnData = await burnResponse.json();
          
          if (burnData.transactionResult && burnData.transactionResult.status === "Success") {
            addBuffToPlayer(currentPlayer as 'player1' | 'player2', powerUp.name, powerUp.effect, powerUp.remainingTurns)
            refreshUser()
            toast.success(`Successfully bought ${powerUp.name}. Power up now equipped!`)
            setIsOpen(false);
          } else {
            toast.error("Transaction failed");
          }
        } catch (error) {
          toast.error(`Failed to purchase power up ${error}`);
        }
    }

    const purchaseCharacter = async (characterId: string, characterName: string) => {
      if (!wallet.publicKey) {
        toast.error("Wallet not connected!");
        return;
      }

      // Check if character is already owned
      if (ownedCharacterIds.includes(characterId)) {
        toast.error("You already own this character!");
        return;
      }

      const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
      const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS;

      // Validate environment variables
      if (!TREASURY_ADDRESS || !CHAKRA_RESOURCE_ADDRESS) {
        console.error("Missing env variables:", {
          TREASURY_ADDRESS,
          CHAKRA_RESOURCE_ADDRESS
        });
        toast.error("Payment system not configured. Please contact support.");
        return;
      }

      setPurchasingCharacterId(characterId);

      try {
        // STEP 1: User payment (CLIENT-SIDE)
        toast.info("💸 Processing payment...");
        
        // Payment breakdown: 60% burnt (30 CHK) + 40% treasury (20 CHK)
        const TREASURY_AMOUNT = 20;

        console.log("Creating payment transaction on client...", {
          TREASURY_ADDRESS,
          CHAKRA_RESOURCE_ADDRESS,
          TREASURY_AMOUNT
        });

        // Create payment transaction (CLIENT-SIDE)
        const { createTransferResourceTransaction: treasuryTxResponse } = 
          await client.createTransferResourceTransaction({
            resource: CHAKRA_RESOURCE_ADDRESS,
            owner: wallet.publicKey.toString(),
            recipient: TREASURY_ADDRESS,
            amount: TREASURY_AMOUNT.toString(),
            // No payer = owner pays gas
          });

        toast.info("📝 Please approve the transaction in your wallet");

        // User signs and sends payment (CLIENT-SIDE)
        const treasuryResponse = await sendClientTransactions(
          client, 
          wallet, 
          treasuryTxResponse
        );
        
        console.log("Payment response:", treasuryResponse);

        // Check if payment succeeded
        if (!treasuryResponse || !treasuryResponse[0]?.responses || treasuryResponse[0].responses[0].status !== "Success") {
          const error = treasuryResponse?.[0]?.responses?.[0]?.error || 'Unknown error';
          toast.error(`Payment failed: ${error}`);
          return;
        }

        console.log("✅ Payment successful! Amount:", TREASURY_AMOUNT);

        // STEP 2: Mint character (backend)
        toast.info("🎨 Minting your character...");
        
          const mintResponse = await fetch("/api/mint-character", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletPublicKey: wallet.publicKey.toString(),
              characterAddresses: characterAdressess,
              characterId: characterId,
            }),
          });

          if (!mintResponse.ok) {
            const errorData = await mintResponse.json();
            toast.error(errorData.error || "Minting failed. Payment was processed.");
            return;
          }

          const mintData = await mintResponse.json();
          
        if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
          refreshUser();
          toast.success(`🎉 ${characterName} is now yours!`);
          await fetchResourcesBalance(); // Refresh balance
          await fetchOwnedCharacters(); // Refresh owned characters
          setIsOpen(false);
        } else {
          toast.error("Minting failed");
        }

      } catch (error) {
        console.error("Purchase error:", error);
        toast.error(`Purchase failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setPurchasingCharacterId(null);
      }
    }


  const isInGameplay = pathname === `/game-play/${roomId}`;
  const CHARACTER_PRICE = 50;

  return (
    <div className={`fixed ${isInGameplay ? 'bottom-[137px] left-5' : 'bottom-8 left-8'}`}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open && wallet.publicKey) {
            fetchResourcesBalance();
            fetchOwnedCharacters();
          }
        }}
      >
        <DialogTrigger className="connect-button-bg size-[84px] px-5 rounded-full items-center justify-center cursor-pointer border-2 border-[#FFFFFF] hover:scale-110 transition-transform">
          {isInGameplay ? (
            <img src="/market.svg" alt="market" width={37} height={37} />
          ) : (
            <ShoppingCart className="w-9 h-9 text-white" />
          )}
        </DialogTrigger>
        <DialogContent className="bg-[#242424] min-w-[calc(100%-2rem)] overflow-auto h-full max-h-[90vh]">
          <DialogTitle className="text-lg text-[#9D9C9E]">
            {isInGameplay 
              ? "Acquire extra gear and power ups to better your battle chances"
              : "Purchase new characters to expand your collection"}
          </DialogTitle>

          <Tabs defaultValue={isInGameplay ? "power-ups" : "characters"} className="">
            <TabsList className="flex items-center justify-between w-full">
              <div className="flex gap-4">
                {/* Power-ups tab - Only show in gameplay */}
                {isInGameplay && (
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] pb-2.5"
                    value="power-ups"
                  >
                    Power-ups
                  </TabsTrigger>
                )}
                
                {/* Characters tab - Only show outside gameplay */}
                {!isInGameplay && (
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] pb-2.5"
                    value="characters"
                  >
                    Purchase Characters
                  </TabsTrigger>
                )}
              </div>
              <div>
                <span className="text-sm md:text-base">
                  Balance: {chakraBalance ? chakraBalance : 0} CHK
                </span>
              </div>
            </TabsList>

            {/* Power-ups Tab Content */}
            {isInGameplay && (
              <TabsContent
                className="flex pt-10 gap-4 flex-wrap overflow-y-auto max-h-[60vh] justify-center"
                value="power-ups"
              >
                {buffs.map((powerup, index) => (
                  <div
                    key={index}
                    className="rounded-[10px] flex flex-col items-center justify-between p-5 bg-[#00000040] max-w-52"
                  >
                    <div>
                      <div className="bg-[#040404] rounded-[10px] flex justify-center">
                        <img
                          src="/power-up-default.svg"
                          alt="power-up-default"
                          width={100}
                          height={100}
                        />
                      </div>

                      <h2 className="font-bold text-sm text-white mb-5 mt-4">
                        {powerup.name}
                      </h2>
                      <p className="text-sm text-white mb-5">
                        Increases attack power by {powerup.effect} for your next{" "}
                        {powerup.remainingTurns} attack plays during a match
                      </p>
                    </div>

                    <Button
                      disabled={((chakraBalance as number) ?? 0) < powerup.price}
                      onClick={() => purchasePowerUp(powerup)}
                      className="flex cursor-pointer w-full bg-[#2F2B24] items-center border-[0.6px] rounded-lg border-[#FFFFFF] gap-2"
                    >
                      <img
                        src="/chakra_coin.svg"
                        alt="chakra"
                        width={20}
                        height={20}
                      />
                      {powerup.price} CHK
                    </Button>
                  </div>
                ))}
              </TabsContent>
            )}

            {/* Characters Tab Content */}
            {!isInGameplay && (
              <TabsContent
                className="flex pt-10 gap-4 flex-wrap overflow-y-auto max-h-[60vh] justify-center"
                value="characters"
              >
                {CHARACTERS.map((character, index) => {
                  const isOwned = ownedCharacterIds.includes(character.id);
                  const isPurchasing = purchasingCharacterId === character.id;
                  
                  return (
                    <div
                      key={index}
                      className={`rounded-[10px] flex flex-col items-center justify-between p-5 bg-[#00000040] max-w-60 border-2 transition-all relative ${
                        isOwned 
                          ? 'border-green-500/50 opacity-50' 
                          : 'border-purple-500/30 hover:border-purple-500'
                      }`}
                    >
                      {/* Owned Badge */}
                      {isOwned && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                          OWNED
                        </div>
                      )}

                      <div className={isOwned ? 'blur-sm' : ''}>
                        <div className="bg-[#040404] rounded-[10px] flex justify-center p-3 mb-3">
                          <img
                            src={`/characters/${character.id}.png`}
                            alt={character.nickname}
                            width={120}
                            height={120}
                            className="object-cover"
                          />
                        </div>

                        <h2 className="font-bold text-base text-white mb-2">
                          {character.nickname}
                        </h2>
                        <div className="text-xs text-gray-300 mb-3 space-y-1">
                          <p><span className="font-bold text-purple-400">Village:</span> {character.village}</p>
                          <p><span className="font-bold text-purple-400">Specialty:</span> {character.specialty}</p>
                          <p><span className="font-bold text-purple-400">Health:</span> {character.baseHealth}</p>
                          <p><span className="font-bold text-purple-400">Abilities:</span> {character.abilities.length}</p>
                        </div>
                      </div>

                      <Button
                        disabled={isOwned || purchasingCharacterId !== null || ((chakraBalance as number) ?? 0) < CHARACTER_PRICE}
                        onClick={() => purchaseCharacter(character.id, character.nickname)}
                        className="flex cursor-pointer w-full bg-purple-600 hover:bg-purple-700 items-center border-[0.6px] rounded-lg border-[#FFFFFF] gap-2 justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {isPurchasing ? (
                          <span className="text-sm flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : isOwned ? (
                          <span className="text-sm">Already Owned</span>
                        ) : (
                          <>
                            <img
                              src="/chakra_coin.svg"
                              alt="chakra"
                              width={20}
                              height={20}
                            />
                            {CHARACTER_PRICE} CHK
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
