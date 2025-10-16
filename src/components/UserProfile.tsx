"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { compactHash } from "./ConnectButton";
import { useEffect, useState } from "react";
import ProfileTabs from "./ProfileTabs";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useUserStore } from "@/store/useUser";

interface UserProfileProps {
  showLabel?: boolean;
  onOpen?: () => void;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UserProfile({ showLabel = false, onOpen, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: UserProfileProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { user } = useUserStore();
  
  // Use external state if provided, otherwise internal
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Get wins and losses from profile customData
  const profile = user?.profiles?.[0];
  const wins = parseInt(profile?.customData?.wins?.[0] || "0");
  const losses = parseInt(profile?.customData?.losses?.[0] || "0");

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.publicKey) {
        const lamports = await connection.getBalance(wallet.publicKey);

        setBalance(lamports / LAMPORTS_PER_SOL);
      }
    };

    fetchBalance();
  }, [wallet.publicKey, connection]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        modal={true}
      >
        {!showLabel && (
          // Desktop: Use DialogTrigger
          <DialogTrigger className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Avatar className="size-[43px]">
              <AvatarImage src="/avater.png" alt="avater" />
              <AvatarFallback>AV</AvatarFallback>
            </Avatar>
          </DialogTrigger>
        )}
        <DialogContent className="overflow-auto h-[600px] bg-[#111318]" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="hidden">Search Game Room</DialogTitle>
          <div>
            <div className="flex gap-5 justify-center mb-12">
              <div>
                <div>
                  <div className="w-[94px] h-[94px] rounded-full">
                    <img src="/profile-avater.png" />
                  </div>
                </div>
              </div>

              <div className="text-white">
                <span className="inline-flex gap-[10px] items-center text-[15px] font-normal mt-2 mb-[14px]">
                  <span>
                    <img src="/wallet.png" alt="wallet" />
                  </span>
                  <span className="font-bold text-[18px]">
                    {user?.profiles
                      ? compactHash(user?.profiles?.[0]?.address)
                      : "Not Connected"}
                  </span>{" "}
                  <button className="p-0 mt-px">
                    <img src="/copy.png" alt="copy" width={20} height={20} />
                  </button>
                </span>
                <p className="mb-2">
                  <span className="text-[#A78ACE] font-bold">
                    Account balance:
                  </span>{" "}
                  {balance} SOL
                </p>
                <p>
                  <span className="text-[#A78ACE] font-bold">Wins:</span> {wins} | <span className="text-[#A78ACE] font-bold">Losses:</span> {losses}
                </p>
              </div>
            </div>

            <ProfileTabs setIsOpen={setIsOpen} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
