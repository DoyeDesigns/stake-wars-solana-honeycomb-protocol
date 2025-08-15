import React from "react";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function GetstartedButton() {
  const { user } = useUserStore();
  const wallet = useWallet();
  const router = useRouter();
  
  return (
    <div>
      <Button
      onClick={() => router.push('/lobby')}
        disabled={user?.profiles ? false : true}
        className={`text-white border border-white ${
          user?.profiles ? "connect-button-bg" : "bg-[#28252D]"
        } min-h-[42px] w-50 rounded-[7px] font-semibold`}
      >
        Get Started
      </Button>
      {wallet.connected &&
        user?.id &&
        (!user.profiles || user.profiles.length === 0) && (
          <p className="text-center text-[#E8BF3C] text-sm font-normal mt-7.5">
            Authenticate with Honeycomb
          </p>
        )}
    </div>
  );
}
