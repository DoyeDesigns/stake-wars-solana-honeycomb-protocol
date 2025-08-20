"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WonMessage() {
  const router = useRouter();
  const wallet = useWallet();

  async function claimXP() {
      try {
         if (!wallet.publicKey) {
           alert("Wallet not connected");
           return;
         }
       
         // Call the server API to mint resources
         const mintResponse = await fetch("/api/mint-resource", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             walletPublicKey: wallet.publicKey.toString(),
             amount: 500,
           }),
         });

         if (!mintResponse.ok) {
           const errorData = await mintResponse.json();
           toast.error(errorData.error || "Failed to mint resources");
           return;
         }

         const mintData = await mintResponse.json();
         
         if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
           toast.success("Successfully claimed 500 XP!");
           router.push("/lobby");
         } else {
           throw new Error("Transaction failed");
         }
      } catch (error) {
        toast.error(`Error Claiming XP: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
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
              className="border-none connect-button-bg text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
            >
              Claim 500 XP
            </Button>
          </div>
        </div>
    </div>
  );
}
