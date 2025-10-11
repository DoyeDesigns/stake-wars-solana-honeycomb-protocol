import React, { useEffect } from "react";
import { useUserStore } from "@/store/useUser";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { toast } from "react-toastify";

const ranks = [
  "Academy Student",
  "Genin",
  "Chūnin",
  "Special Jōnin",
  "Jōnin",
  "Anbu Black Ops",
  "Kage Candidate",
  "Kage",
  "Sannin",
  "Legendary Ninja",
  "Sage",
  "Jinchūriki Vessel",
  "Tailed Beast Master",
  "Six Paths Disciple",
  "Ōtsutsuki Initiate",
  "Ōtsutsuki Warrior",
  "Ōtsutsuki Sage",
  "Ōtsutsuki God",
];

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

export default function NinjaRanks() {
  const { user, refreshUser } = useUserStore();
  const wallet = useWallet();

  const matchingProfile = user?.profiles?.find(
    (profile) => profile?.project === PROJECT_ADDRESS
  );

  useEffect(() => {
    if (wallet.publicKey) {
      refreshUser();
    }
  }, [wallet.publicKey])

  const achievements = matchingProfile?.platformData?.achievements ?? [];


  const claimBadge = async (index: number) => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!matchingProfile?.address) {
      toast.error("No matching profile found!");
      return;
    }

    try {
      // Call the server API to update platform data (add achievement)
      const updateResponse = await fetch("/api/update-platform-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileAddress: matchingProfile.address,
          index: index,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        toast.error(errorData.error || "Failed to update platform data");
        return;
      }

      const updateData = await updateResponse.json();
      
             if (updateData.transactionResult && updateData.transactionResult.status === "Success") {
         toast.success(`Successfully claimed badge! ${updateData.transactionResult.signature}`);
         await refreshUser();
       } else {
         toast.error("Transaction failed");
       }
    } catch (error) {
      toast.error(`Failed to claim badge: ${error}`);
    }
  };


  
  const xp = Number(matchingProfile?.platformData?.xp ?? 0);
  const xpPerLevel = 500;
  const thresholds = ranks.map((_, i) => xpPerLevel * (i + 1));

  const currentLevelIndex = thresholds.findIndex((reqXp) => xp < reqXp);

  return (
    <div className="w-full max-w-lg mx-auto">
      {ranks.map((rank, index) => {
        const requiredXp = thresholds[index];
        const isCurrent = index === currentLevelIndex;
        const hasReached = xp >= requiredXp;

        let progress = 0;
        if (index < currentLevelIndex) {
          progress = 100;
        } else if (isCurrent) {
          const prevXp = index === 0 ? 0 : thresholds[index - 1];
          progress = Math.min(
            ((xp - prevXp) / (requiredXp - prevXp)) * 100,
            100
          );
        }

        const hasBadge = achievements.includes(index);

        const canClaim = !hasBadge && xp >= requiredXp;

        return (
          <div
            key={index}
            className={`px-7 py-4 border-t border-b border-[#6A6868] ${
              isCurrent ? "bg-[#373636]" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-8 mb-2">
              <h1 className="font-bold text-wrap text-base">{rank}</h1>
              <div className="flex items-center gap-2.5">
                <span className="text-[#FFD95E] text-sm">{requiredXp} XP</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <img src="/star.svg" width={15} height={15} alt="star" />
              <span className="text-[#FFCE31] capitalize text-xs">
                Level {index + 1}
              </span>
            </div>

            <Progress
              value={hasBadge ? 100 : progress}
              className={`h-2 ${hasBadge || hasReached ? "bg-[#BFE528] lg:bg-linear-65 from-[#B91770] to-[#3B74B8]" : ""}`}
            />

            <Button
              onClick={() => canClaim && claimBadge(index)}
              disabled={hasBadge || !canClaim}
              className={`mt-4 w-full font-bold py-2 rounded transition ${
                hasBadge
                  ? "bg-green-600 text-white cursor-not-allowed"
                  : canClaim
                  ? "bg-[#FFCE31] text-black hover:bg-[#FFD95E]"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {hasBadge
                ? "✅ Badge Claimed"
                : canClaim
                ? "Claim Badge"
                : `Begin ${rank} Missions`}
            </Button>

            <div className="mt-2 text-xs text-gray-400">
              {hasBadge
                ? "🏅 Badge already claimed"
                : hasReached
                ? "✅ Rank achieved"
                : isCurrent
                ? `⏳ ${requiredXp - xp} XP to unlock next rank`
                : `🔒 Locked`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
