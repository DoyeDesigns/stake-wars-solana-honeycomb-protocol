import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function GetstartedButton() {
  const { user, refreshUser } = useUserStore();
  const wallet = useWallet();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  
  // Refresh user data when wallet connects
  useEffect(() => {
    const loadUserData = async () => {
      if (wallet.connected && wallet.publicKey) {
        setIsCheckingProfile(true);
        await refreshUser();
        setIsCheckingProfile(false);
      } else {
        setIsCheckingProfile(false);
      }
    };
    
    loadUserData();
  }, [wallet.connected, wallet.publicKey]);
  
  // Only disable if wallet is not connected
  const isDisabled = !wallet.connected;
  
  // Only show profile message if:
  // 1. Wallet is connected
  // 2. User data is fully loaded (not checking anymore)
  // 3. User exists but has no profiles
  const showProfileMessage = 
    wallet.connected && 
    !isCheckingProfile && 
    user && 
    user.id && 
    (!user.profiles || user.profiles.length === 0);
  
  return (
    <div>
      <Button
        onClick={() => router.push('/lobby')}
        disabled={isDisabled}
        className={`text-white border border-white ${
          wallet.connected ? "connect-button-bg" : "bg-[#28252D]"
        } min-h-[42px] w-50 rounded-[7px] font-semibold`}
      >
        Get Started
      </Button>
      {showProfileMessage && (
        <p className="text-center text-[#E8BF3C] text-sm font-normal mt-7.5">
          Create a profile to start playing
        </p>
      )}
    </div>
  );
}
