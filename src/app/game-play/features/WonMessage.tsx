"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/store/useUser";

export default function WonMessage() {
  const router = useRouter();
  const wallet = useWallet();
  const { user, refreshUser } = useUserStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

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
           router.push("/lobby");
         } else {
           throw new Error("Chakra mint transaction failed");
         }
         refreshUser();
      } catch (error) {
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
