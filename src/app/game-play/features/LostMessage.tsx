'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import { useUserStore } from '@/store/useUser';
import { useAuthStore } from '@/store/useAuth';
import { client } from '@/utils/constants/client';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';
import base58 from 'bs58';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

interface LostMessageProps {
  roomId: string;
}

export default function LostMessage({ roomId }: LostMessageProps) {
  const router = useRouter();
  const wallet = useWallet();
  const { user, refreshUser } = useUserStore();
  const { accessToken, setAccessToken } = useAuthStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isWagerMatch, setIsWagerMatch] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0);

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

  async function claimXP() {
        try {
           if (!wallet.publicKey) {
             alert("Wallet not connected");
             return;
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

           // Get access token FIRST (either from store or by authenticating)
           const token = await getAccessToken();
           if (!token) {
             toast.error("Failed to authenticate. Please try again.");
             return;
           }

           // Update profile with loss stat BEFORE claiming rewards
           const updateStatsResponse = await fetch("/api/update-profile-stats", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               profileAddress: profileAddress,
               payer: wallet.publicKey.toString(),
               result: "loss",
               accessToken: token,
             }),
           });

           if (!updateStatsResponse.ok) {
             toast.error("Failed to update loss stats");
             return;
           }

           const statsData = await updateStatsResponse.json();
           
           if (statsData.success && statsData.transaction) {
             // Sign and send the profile update transaction
             const result = await sendClientTransactions(client, wallet, statsData.transaction);
             
             if (result[0].responses[0].status === 'Success') {
               toast.success(`Loss recorded! Total losses: ${statsData.stats.losses}`);
             } else {
               toast.error("Failed to record loss");
               return;
             }
           }
           
           const claimResponse = await fetch("/api/claim-xp", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               profileAddress: profileAddress,
               xpAmount: 5,
             }),
           });

           if (!claimResponse.ok) {
             const errorData = await claimResponse.json();
             toast.error(errorData.error || "Failed to claim XP");
             return;
           }

           const claimData = await claimResponse.json();
           
           if (claimData.transactionResult && claimData.transactionResult.status === "Success") {
            toast.success(`Successfully claimed 5 XP! ${claimData.transactionResult.signature}`);
            setHasClaimed(true);
           } else {
            throw new Error('XP claim transaction failed');
           }

           const mintResponse = await fetch("/api/mint-resource", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               walletPublicKey: wallet.publicKey.toString(),
               amount: 20,
             }),
           });

           if (!mintResponse.ok) {
             const errorData = await mintResponse.json();
             toast.error(errorData.error || "Failed to mint resources");
             return;
           }

           const mintData = await mintResponse.json();
           
           if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
            toast.success(`Successfully claimed 20 Chakra! ${mintData.transactionResult.signature}`);
           } else {
            throw new Error('Chakra mint transaction failed');
           }

           refreshUser();
           router.push("/lobby");
        } catch (error) {
          toast.error(`Error Claiming Rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        } finally {
          setIsClaiming(false);
        } 
      }

  return (
    <div className="bg-[#191919]/60 h-full w-full top-0 left-0">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="flex justify-end w-[60%] -mt-20"></div>
        <img
          className="-mb-[98px] lg:-mb-[115px] z-30 size-[90px] lg:size-[106px]"
          src="/sad-look.png"
          alt="lost-look"
          width={106}
          height={106}
        />
        <img
          src="/winner-background.png"
          alt="winner-bg"
          width={306}
          height={306}
        />
        <div className="flex flex-col justify-center items-center gap-4 -mt-48">
          <div className="flex flex-col justify-center items-center">
            <span className="text-white font-extrabold text-[16px] lg:text-[22px] text-center">
              You Lost!!
            </span>
            {isWagerMatch && (
              <div className="bg-red-400/20 border-2 border-red-400 rounded-lg px-4 py-2 mt-2">
                <span className="text-red-400 font-bold text-lg">
                  😢 Lost {wagerAmount} CKRA
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={() => router.push("/")}
            className="border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
          >
            <img src="/rematch.png" alt="winner-bg" width={24} height={24} />{" "}
            Rematch
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
          >
            <img src="/exit.png" alt="winner-bg" width={24} height={24} /> Exit
            Game
          </Button>
          <Button
            onClick={() => claimXP()}
            disabled={isClaiming || hasClaimed}
            className="border-none connect-button-bg text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
          >
            {isClaiming ? "Claiming..." : hasClaimed ? "Claimed!" : "Claim 5 XP + 20 Chakra"}
          </Button>
        </div>
      </div>
    </div>
  );
}
