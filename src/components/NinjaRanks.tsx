import React from "react";
import { useUserStore } from "@/store/useUser";
import { Progress } from "@/components/ui/progress";
import { client } from "@/utils/constants/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { BadgesCondition } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { Button } from "./ui/button";
import { toast } from "react-toastify";

const ranks = [
  "Academy Student",
  "Genin",
  "Chunin",
  "Special Jonin",
  "Jonin",
  "Anbu",
  "Anbu Captain",
  "Kage Assistant",
  "Kage",
  "Sannin",
  "Sage",
  "Jinchuriki",
  "Akatsuki Member",
  "Akatsuki Leader",
  "Otsutsuki",
];

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

export default function NinjaRanks() {
  const { user } = useUserStore();
  const wallet = useWallet();

  // Grab achievements array for this project
  const matchingProfile = user?.profiles?.find(
    (profile) => profile?.project === PROJECT_ADDRESS
  );

  const achievements = matchingProfile?.platformData?.achievements ?? [];

  const claimBadge = async (index: number) => {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const { createClaimBadgeCriteriaTransaction: txResponse } =
      await client.createClaimBadgeCriteriaTransaction({
        args: {
          profileAddress: matchingProfile?.address as string,
          projectAddress: process.env.PROJECT_ADDRESS as string, 
          proof: BadgesCondition.Public,
          payer: wallet.publicKey.toString(),
          criteriaIndex: index,
        },
      });

    const response = await sendClientTransactions(client, wallet, txResponse);
    toast.success(`Claim response ${response[0].responses[0].signature}`);
  };

  const xp = Number(user?.profiles?.[0]?.platformData?.xp ?? 0);
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

        const hasBadge = achievements[index] === 1;

        const canClaim = !hasBadge && (xp >= requiredXp && (!isCurrent || progress >= 100));

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

            <Progress value={progress} className="h-2" />

            <Button
              onClick={() => canClaim && claimBadge(index)}
              disabled={!canClaim}
              className={`mt-4 w-full font-bold py-2 rounded transition ${
                canClaim
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
