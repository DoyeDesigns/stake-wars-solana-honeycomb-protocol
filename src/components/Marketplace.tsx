"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import { client } from '@/utils/constants/client';
import { Button } from './ui/button';
import { buffs } from '@/lib/buffs';
import useOnlineGameStore from '@/store/useOnlineGame';
import { usePathname } from 'next/navigation';

const CHAKRA_RESOURCE_TREE_ADDRESS = process.env.CHAKRA_RESOURCE_TREE_ADDRESS as string

export default function Marketplace() {
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
    const wallet = useWallet();
    const { addBuffToPlayer, gameState, roomId } = useOnlineGameStore();
    const pathname = usePathname();

    const currentPlayer = (() => {
      if (gameState?.gameStatus !== 'inProgress') return null;

      const isPlayer1 = gameState.player1?.id === wallet.publicKey?.toString();
      const isPlayer2 = gameState.player2?.id === wallet.publicKey?.toString();

      if (isPlayer1) return 'player1';
      if (isPlayer2) return 'player2';
      return null;
    })();


    useEffect(() => {
      if (wallet.connected) {
        fetchResourcesBalance();
      }
    }, [wallet.connected]);

    const fetchResourcesBalance = async () => {
      if (!wallet.connected) {
        toast.error("Please connect wallet to view resources balance.");
        return
      }

      const resources = await client.findHoldings({
        holders: [wallet.publicKey?.toString() as string],
        trees: [CHAKRA_RESOURCE_TREE_ADDRESS]
      });

      setChakraBalance(Number(resources.holdings[0]?.balance));
    }

    const purchasePowerUp = async (powerUp: { name: string; effect: number; remainingTurns: number; price: number; village: string; }) => {
        if (!wallet.publicKey) {
          toast.error("Wallet not connected!");
          return;
        }

        try {
                     // Call the server API to burn resources
           const burnResponse = await fetch("/api/burn-resource", {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               amount: powerUp.price,
               userPublicKey: wallet.publicKey.toString(),
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
            fetchResourcesBalance()
            toast.success(`Successfully bought ${powerUp.name}. Power up now equipped!`)
            setIsOpen(false);
          } else {
            toast.error("Transaction failed");
          }
        } catch (error) {
          console.error("Purchase power up error:", error);
          toast.error("Failed to purchase power up");
        }
    }


  if (pathname !== `/game-play/${roomId}`) return null

  return (
    <div className="fixed bottom-[137px] left-5">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="connect-button-bg size-[84px] px-5 rounded-full items-center justify-center cursor-pointer border-2 border-[#FFFFFF]">
          <img src="/market.svg" alt="market" width={37} height={37} />
        </DialogTrigger>
        <DialogContent className="bg-[#242424] min-w-[calc(100%-2rem)] my-5 overflow-auto max-h-[450px] sm:max-h-[550px]">
          <DialogTitle className="text-0[18px] text-[#9D9C9E]">
            Acquire extra gear and power ups to better your battle chances
          </DialogTitle>

          <Tabs defaultValue="power-ups" className="">
            <TabsList className="flex items-center justify-between w-full">
              <div>
                <TabsTrigger
                  className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] pb-2.5"
                  value="power-ups"
                >
                  Power-ups
                </TabsTrigger>
              </div>
              <div>
                <span>Balance: {chakraBalance ? chakraBalance : 0} CHK(chakra)</span>
              </div>
            </TabsList>
            <TabsContent className='flex pt-10 gap-4 flex-wrap !h-[150px] overflow-hidden justify-center' value="power-ups">
              {buffs.map((powerup, index) => (
                <div key={index} className='rounded-[10px] flex flex-col items-center justify-between p-5 bg-[#00000040] max-w-52'>
                  <div>
                    <div className='bg-[#040404] rounded-[10px] flex justify-center'>
                    <img src="/power-up-default.svg" alt="power-up-default" width={100} height={100} />
                  </div>

                  <h2 className='font-bold text-sm text-white mb-5 mt-4'>{powerup.name}</h2>
                  <p className='text-sm text-white mb-5'>Increases attack power by {powerup.effect} for your next {powerup.remainingTurns} attack plays during a match</p>
                  </div>

                  <Button disabled={(chakraBalance as number ?? 0) < powerup.price} onClick={() => purchasePowerUp(powerup)} className='flex cursor-pointer w-full bg-[#2F2B24] items-center border-[0.6px] rounded-lg border-[#FFFFFF] gap-2'><img src="/chakra_coin.svg" alt="chakra" width={20} height={20} />{powerup.price} CHK</Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
