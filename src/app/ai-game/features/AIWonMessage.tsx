import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/store/useUser';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;


const AIWonMessage: React.FC = () => {
  const wallet = useWallet();
  const { user, refreshUser } = useUserStore();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const matchingProfile = user?.profiles?.find(
    (profile) => profile?.project === PROJECT_ADDRESS
  );

  const claimXP = async () => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!matchingProfile?.address) {
      toast.error("No matching profile found!");
      return;
    }

    setIsClaiming(true);
    try {
      // Call the server API to claim XP
      const claimResponse = await fetch("/api/claim-xp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileAddress: matchingProfile.address,
          xpAmount: 50,
        }),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        toast.error(errorData.error || "Failed to claim XP");
        return;
      }

      const claimData = await claimResponse.json();
      
      if (claimData.transactionResult && claimData.transactionResult.status === "Success") {
        toast.success("Successfully claimed 50 XP!");
        setHasClaimed(true);
        await refreshUser();
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Claim XP error:", error);
      toast.error("Failed to claim XP");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBackToLobby = () => {
    router.push('/lobby');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#3F3F3F] rounded-[20px] p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Victory!</h2>
          <p className="text-gray-300 mb-4">
            You defeated the AI opponent! You earned 50 XP for your victory.
          </p>
          <div className="bg-green-600 text-white py-2 px-4 rounded-lg mb-6">
            <span className="font-bold">+50 XP</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={claimXP}
            disabled={isClaiming || hasClaimed}
            className={`font-bold py-3 px-6 rounded-lg ${
              hasClaimed
                ? "bg-green-600 text-white cursor-not-allowed"
                : "bg-[#FFCE31] hover:bg-[#FFD95E] text-black"
            }`}
          >
            {hasClaimed ? "✅ XP Claimed" : isClaiming ? "Claiming..." : "Claim 50 XP"}
          </Button>
          <Button
            onClick={handleBackToLobby}
            variant="outline"
            className="border-[#6B6969] text-white hover:bg-[#6B6969] font-bold py-3 px-6 rounded-lg"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIWonMessage;

