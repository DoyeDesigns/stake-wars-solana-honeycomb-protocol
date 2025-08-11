"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { client } from "@/utils/constants/client";
import { useWallet } from "@solana/wallet-adapter-react";

const CHAKRA_RESOURCE_ADDRESS = process.env.CHAKRA_RESOURCE_ADDRESS as string
const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string

export default function WonMessage() {
  const router = useRouter();
  const wallet = useWallet();

  async function claimXP() {
      try {
         if (!wallet.publicKey || !CHAKRA_RESOURCE_ADDRESS) {
           alert("Missing required data");
           return;
         }
       
         const { 
         createMintResourceTransaction: txResponse 
       } = await client.createMintResourceTransaction({
           resource: CHAKRA_RESOURCE_ADDRESS, // Resource public key as a string
           amount: "500",
           authority: PROJECT_AUTHORITY, 
           owner: wallet.publicKey.toString(), 
           // payer: adminPublicKey.toString(), 
       });
       
         const response = await sendClientTransactions(client, wallet, txResponse);
         if (response[0].responses[0].status === "Success") {
           toast.success(`Successfully claimed:, ${response}`);
           router.push("/lobby");
         } else {
           throw new Error("transaction failed");
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
