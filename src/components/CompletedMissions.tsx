import React from "react";
import { MissionType } from "./Missions";
import { Progress } from "@radix-ui/react-progress";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import { client } from "@/utils/constants/client";
import { useUserStore } from "@/store/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useMissionsStore } from "@/store/useMission";

type CompletedMissionsProps = {
  missions: MissionType[];
};

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string
const PROJECT_AUTHORITY = process.env.PROJECT_AUTHORITY as string


export default function CompletedMissions({ missions }: CompletedMissionsProps) {
  const { user, updateUser } = useUserStore();
  const wallet = useWallet();
  const {setCompleted} = useMissionsStore();

  const sortedMissions = [...missions].sort((a, b) => {
    if (a.claimed === b.claimed) return 0;
    return a.claimed ? 1 : -1; // claimed go last
  });

  const addXP = async (mission: MissionType) => {
  try {
    if (!wallet.publicKey) {
      alert("Wallet not connected!");
      return;
    }

    const matchingProfile = user?.profiles?.find(
      (profile) => profile?.project === PROJECT_ADDRESS
    );

    const { createUpdatePlatformDataTransaction: txResponse } =
      await client.createUpdatePlatformDataTransaction({
        profile: matchingProfile?.address as string,
        authority: PROJECT_AUTHORITY,
        platformData: {
          addXp: mission.reward.toString(), // Award XP amount, not whole object
        },
      });

    const response = await sendClientTransactions(client, wallet, txResponse);

    if (response[0].responses[0].status === "Success") {
      if (mission.id) {
        const missionRef = doc(db, "missions", mission.id);
        await updateDoc(missionRef, { claimed: true });

        updateProfile()
        
        setCompleted(
          missions.map((m) =>
            m.id === mission.id ? { ...m, claimed: true } : m
          )
        );
      }

      toast.success("XP successfully claimed");
    } else {
      toast.error("Failed to claim XP");
    }
  } catch (error) {
    toast.error(`Failed to add XP: ${error instanceof Error ? error.message : error}`);
  }
};

const updateProfile = async () => {
  if (!user) return;

  try {
    const { profile } = await client.findProfiles({
      projects: [PROJECT_ADDRESS],
      includeProof: true,
    });

    if (!user.profiles || user.profiles.length === 0) {
      updateUser({ profiles: profile });
    } else {
      const updatedProfiles = [...user.profiles, ...profile];
      updateUser({ profiles: updatedProfiles });
    }
  } catch (err) {
    toast.error(`Error checking for profile: ${err instanceof Error ? err.message : err}`);
  }
};


  return (
    <div>
      {sortedMissions.map((mission, index) => {
        const startedAtMs = mission.startedAt ? mission.startedAt.toDate().getTime() : 0;
        const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);

        return (
          <div
            key={index}
            className={`px-7 py-4 ${
              !mission.claimed ? "bg-[#373636]" : ""
            } border-t-[0.5px] border-b-[0.5px] border-t-[#6A6868] border-b-[#6A6868]`}
          >
            <div className="flex items-center justify-between gap-8 mb-2">
              <h1 className="font-bold text-wrap text-xs sm:text-base">
                {mission.name}
              </h1>
              {mission.claimed ? (
                <div className="flex gap-2 items-center">
                  <img
                    src="/completed.svg"
                    alt="completed"
                    width={18}
                    height={18}
                    className="size-3 sm:size[18px]"
                  />
                  <span className="text-[#BFE528] text-xs md:text-sm">
                    Completed
                  </span>
                </div>
              ) : (
                <Button onClick={() => addXP(mission)} className="flex bg-[#232320] rounded-[5px] shadow-2xl shadow-[#FFF1763B] cursor-pointer items-center gap-2.5">
                  <img src="/xp.png" alt="xp coin" />
                  <span className="text-[#FFD95E] text-sm font-medium">
                    claim XP
                  </span>
                </Button>
              )}

            </div>
            {mission.claimed ? <></> : (
              <div>
                <div className="flex items-center gap-2 my-3 mb-2">
                  <span className="text-[#BFE528] text-sm">Completed</span>
                  <div className="flex items-center gap-2.5">
                    <img src="/xp.png" alt="xp coin" />
                    <span className="text-[#FFD95E] text-sm">
                      {mission.reward} XP
                    </span>
                  </div>
                </div>

                <div>
                  <Progress
                    value={
                      ((elapsedSeconds > mission.duration ? 100 : elapsedSeconds) /
                        mission.duration) *
                      100
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-2">
                <img src="/star.svg" width={15} height={15} alt="star" />
                <span className="text-[#FFCE31] capitalize text-xs">
                  Mission level:{" "}
                  <span className="text-white">{mission.difficulty}</span>
                </span>
              </div>
              <div
                className={`flex items-center gap-1 ${
                  mission.claimed ? "block" : "hidden"
                }`}
              >
                <img className="size-3" src="/xp.png" alt="xp coin" />
                <span className="text-[#FFD95E] text-xs sm:text-sm">
                  {mission.reward} XP
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

