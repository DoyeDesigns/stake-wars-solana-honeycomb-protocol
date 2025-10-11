"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/store/useUser";
import { useAuthStore } from "@/store/useAuth";
import { client } from "@/utils/constants/client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import base58 from "bs58";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

interface WonMessageProps {
  roomId: string;
}

export default function WonMessage({ roomId }: WonMessageProps) {
  const router = useRouter();
  const wallet = useWallet();
  const { user, refreshUser } = useUserStore();
  const { accessToken, setAccessToken } = useAuthStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isWagerMatch, setIsWagerMatch] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0);
  const [wagerId, setWagerId] = useState<string | null>(null);
  const [wagerSettled, setWagerSettled] = useState(false);

  // Check if this is a wager match
  useEffect(() => {
    const checkWagerMatch = async () => {
      try {
        const gameRoomRef = doc(db, "gameRooms", roomId);
        const gameRoomSnap = await getDoc(gameRoomRef);
        
        if (gameRoomSnap.exists()) {
          const gameData = gameRoomSnap.data();
          if (gameData.isWagerMatch && gameData.wagerId) {
            setIsWagerMatch(true);
            setWagerAmount(gameData.wagerAmount || 0);
            setWagerId(gameData.wagerId);
          }
        }
      } catch (error) {
        console.error("Error checking wager match:", error);
      }
    };

    checkWagerMatch();
  }, [roomId]);

  // Function to get or refresh access token
  const getAccessToken = async (): Promise<string | null> => {
    if (accessToken) return accessToken;

    if (!wallet.publicKey || !wallet.signMessage) {
      toast.error("Wallet not properly connected");
      return null;
    }

    try {
      const {
        authRequest: { message: authRequest },
      } = await client.authRequest({
        wallet: wallet.publicKey.toString(),
      });

      const encodedMessage = new TextEncoder().encode(authRequest);
      const signedUIntArray = await wallet.signMessage(encodedMessage);
      const signature = base58.encode(signedUIntArray);

      const { authConfirm } = await client.authConfirm({
        wallet: wallet.publicKey.toString(),
        signature,
      });

      if (authConfirm.accessToken) {
        setAccessToken(authConfirm.accessToken);
        return authConfirm.accessToken;
      }
      return null;
    } catch (error) {
      toast.error(`Authentication failed: ${error}`);
      return null;
    }
  };

  async function settleWager() {
    if (!wagerId || !wallet.publicKey) return;
    
    try {
      const response = await fetch('/api/wager/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerId,
          winnerId: wallet.publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to settle wager");
      }

      setWagerSettled(true);
      toast.success(`🎉 Wager settled! You won ${wagerAmount * 2} CKRA!`);
    } catch (error) {
      toast.error(`Failed to settle wager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to stop the claim flow
    }
  }

  async function claimXP() {
      try {
         if (!wallet.publicKey) {
           alert("Wallet not connected");
           return;
         }

         // If this is a wager match, settle it first
         if (isWagerMatch && wagerId && !wagerSettled) {
           console.log("🎰 Settling wager before claiming rewards...");
           await settleWager();
           console.log("✅ Wager settled successfully");
         }

         if (!user?.profiles || user.profiles.length === 0) {
           toast.error("No profile found. Please create a profile first.");
           return;
         }

         setIsClaiming(true);
         
         const profileAddress = user.profiles[0]?.address;
         
         if (!profileAddress) {
           toast.error("Profile address not found");
           return;
         }

         console.log("🔐 Getting access token...");
         // Get access token FIRST (either from store or by authenticating)
         const token = await getAccessToken();
         if (!token) {
           toast.error("Failed to authenticate. Please try again.");
           return;
         }
         console.log("✅ Access token obtained");

         console.log("📊 Updating win stats...");
         // Update profile with win stat BEFORE claiming rewards
         const updateStatsResponse = await fetch("/api/update-profile-stats", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             profileAddress: profileAddress,
             payer: wallet.publicKey.toString(),
             result: "win",
             accessToken: token,
           }),
         });

         console.log("Stats update response status:", updateStatsResponse.status);

         if (!updateStatsResponse.ok) {
           const errorData = await updateStatsResponse.json();
           console.error("❌ Failed to update stats:", errorData);
           toast.error(`Failed to update win stats: ${errorData.error || 'Unknown error'}`);
           return;
         }

         const statsData = await updateStatsResponse.json();
         console.log("Stats data received:", statsData);
         
         if (statsData.success && statsData.transaction) {
           console.log("🖊️ Signing stats update transaction...");
           // Sign and send the profile update transaction
           const result = await sendClientTransactions(client, wallet, statsData.transaction);
           
           console.log("Stats transaction result:", result);
           
           if (result[0].responses[0].status === 'Success') {
             toast.success(`Win recorded! Total wins: ${statsData.stats.wins}`);
             console.log("✅ Win stats updated successfully");
           } else {
             toast.error("Failed to record win");
             console.error("❌ Stats transaction failed:", result);
             return;
           }
         } else {
           console.warn("⚠️ No transaction returned from stats update");
         }
         
         const claimResponse = await fetch("/api/claim-xp", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             profileAddress: profileAddress,
             xpAmount: 10,
           }),
         });

         if (!claimResponse.ok) {
           const errorData = await claimResponse.json();
           toast.error(errorData.error || "Failed to claim XP");
           return;
         }

         const claimData = await claimResponse.json();
         
         if (claimData.transactionResult && claimData.transactionResult.status === "Success") {
           toast.success(`Successfully claimed 10 XP! ${claimData.transactionResult.signature}`);
           setHasClaimed(true);
         } else {
           throw new Error("XP claim transaction failed");
         }

         const mintResponse = await fetch("/api/mint-resource", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             walletPublicKey: wallet.publicKey.toString(),
             amount: 50,
           }),
         });

         if (!mintResponse.ok) {
           const errorData = await mintResponse.json();
           toast.error(errorData.error || "Failed to mint resources");
           return;
         }

         const mintData = await mintResponse.json();
         
         if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
           toast.success(`Successfully claimed 50 Chakra! ${mintData.transactionResult.signature}`);
         } else {
           throw new Error("Chakra mint transaction failed");
         }

         refreshUser();
         router.push("/lobby");
      } catch (error) {
        console.error("❌ Error in claimXP flow:", error);
        console.error("Error details:", error instanceof Error ? error.message : error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        toast.error(`Error Claiming Rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      } finally {
        setIsClaiming(false);
      } 
    }

  return (
    <div className="bg-[#191919]/60 h-full top-0 left-0">
        <div className="flex flex-col justify-center items-center h-full">
          <div className='flex justify-end w-[60%] -mt-20'>
        </div>
          <img
            src="/winner-background.png"
            alt="winner-bg"
            width={306}
            height={306}
          />
          <div className="flex flex-col justify-center items-center gap-4 -mt-48">
            <div className="flex flex-col justify-center items-center">
              <span className="text-white font-extrabold text-[22px] text-center">
                You Won!!
              </span>
              {isWagerMatch && (
                <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg px-4 py-2 mt-2">
                  <span className="text-yellow-400 font-bold text-lg">
                    🏆 Prize: {wagerAmount * 2} CKRA
                  </span>
                </div>
              )}
            </div>
            <Button onClick={() => router.push('/')} className="border-none cursor-pointer bg-white text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]">
              <img
                src="/rematch.png"
                alt="winner-bg"
                width={24}
                height={24}
              />{" "}
              Rematch
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
            >
              <img src="/exit.png" alt="winner-bg" width={24} height={24} />{" "}
              Exit Game
            </Button>
            <Button
              onClick={() => claimXP()}
              disabled={isClaiming || hasClaimed}
              className="border-none connect-button-bg text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
            >
              {isClaiming ? "Claiming..." : hasClaimed ? "Claimed!" : "Claim 10 XP + 50 Chakra"}
            </Button>
          </div>
        </div>
    </div>
  );
}
