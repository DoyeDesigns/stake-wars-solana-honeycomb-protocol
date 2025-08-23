"use client";

import React, { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from "@/store/useUser";
import { Character } from "@/lib/characters";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import { Timestamp, addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { nanoid } from 'nanoid';
import OngoingMissions from "./OngoingMissions";
import CompletedMissions from "./CompletedMissions";
import { useMissionsStore } from "@/store/useMission";
import { Button } from "./ui/button";
import { client } from "@/utils/constants/client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import NinjaRanks from "./NinjaRanks";

export type MissionType = {
  id: string;
  name: string;
  difficulty: string;
  reward: number;
  duration: number; // seconds
  startedAt?: Timestamp;
  claimed: boolean;
  wallet: string;
  missionPubkey: string
};

type SelectedCharacter = {
  character: Character;
};

const hardcodedMissions = [
  { id: "mission1", name: "Defend the Village", difficulty: "Easy", reward: 25, duration: 43200, claimed: false, missionPubkey: "Dn8DjQgh1dJFem4tYEUjTeaxagRumMt7nj36JKcpVHm7"},
  { id: "mission2", name: "Gather Intelligence", difficulty: "Medium", reward: 50, duration: 86400, claimed: false, missionPubkey: "Dn8DjQgh1dJFem4tYEUjTeaxagRumMt7nj36JKcpVHm7"}
];

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;
const LUT_ADDRESS = process.env.LUT_ADDRESS as string;

export default function Missions({ character }: SelectedCharacter) {
  const wallet = useWallet();
  const { user } = useUserStore();
  const {
  ongoingMissions,
  completedMissions,
  setOngoing,
  setCompleted,
  moveToCompleted,
  remainingTimes,
  setRemainingTime
} = useMissionsStore();

const fetchUserMissions = async () => {
  if (!wallet.publicKey) return;
  try {
    const missionsRef = collection(db, "missions");
    const q = query(missionsRef, where("wallet", "==", wallet.publicKey.toString()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const allMissions = querySnapshot.docs.map((doc) => doc.data() as MissionType);

      const ongoing: MissionType[] = [];
      const completed: MissionType[] = [];

      allMissions.forEach((m) => {
        const elapsed = m.startedAt ? Math.floor(Timestamp.now().seconds - m.startedAt.seconds) : 0;
        const remaining = m.duration - elapsed;

        if (remaining > 0) ongoing.push(m);
        else completed.push(m);
      });

      setOngoing(ongoing);
      setCompleted(completed);
    } else {
      setOngoing([]);
      setCompleted([]);
    }
  } catch (error) {
    toast.error(`Error fetching missions, ${error}`);
    setOngoing([]);
    setCompleted([]);
  }
};

const sendCharacterOnMission = async (missionData: MissionType) => {
  try {
    if (!wallet.publicKey) {
      toast.info("Connect Wallet to continue");
      return;
    }

    const matchingProfile = user?.profiles?.find(
      (profile) => profile?.project === PROJECT_ADDRESS
    );

    const { createSendCharactersOnMissionTransaction: txResponse } =
      await client.createSendCharactersOnMissionTransaction({
        data: {
          mission: missionData.missionPubkey,
          characterAddresses: [character.address as string],
          authority: wallet.publicKey.toString(),
          // payer: PROJECT_AUTHORITY,
          userId: matchingProfile?.userId,
        },
        lutAddresses: [LUT_ADDRESS],
      });

    const response = await sendClientTransactions(client, wallet, txResponse);

    if (response[0].responses[0].status === "Success") {
      toast.success("Character successfully sent on a mission");
    } else {
      toast.error("Failed to send character on mission");
    }
  } catch (error) {
    console.error("Error sending character on mission:", error);
    toast.error("An error occurred while sending the character on a mission");
  }
};


const shortId = nanoid(8)

useEffect(() => {
  fetchUserMissions()
}, [wallet.connected]);

  useEffect(() => {
  const interval = setInterval(() => {
    ongoingMissions.forEach((mission) => {
      const elapsed = mission.startedAt
        ? Math.floor(Timestamp.now().seconds - mission.startedAt.seconds)
        : 0;
      const remaining = mission.duration - elapsed;

      if (remaining <= 0) {
        moveToCompleted(mission.id);
      } else {
        setRemainingTime(mission.id, remaining);
      }
    });
  }, 1000);

  return () => clearInterval(interval);
}, [ongoingMissions, moveToCompleted, setRemainingTime]);


  async function startMission(missionData: MissionType) {
  try {
    if (!wallet.publicKey) {
      toast.info("Connect wallet to start a mission");
      return;
    }

    const missionsRef = collection(db, "missions");
    const walletId = wallet.publicKey.toString();

    // Send character to mission
    await sendCharacterOnMission(missionData);

    // Save mission to Firestore
    const docRef = await addDoc(missionsRef, {
      ...missionData,
      startedAt: Timestamp.now(),
      wallet: walletId,
    });

    // Update local state immediately
    setOngoing([
      ...ongoingMissions,
      { ...missionData, id: docRef.id, startedAt: Timestamp.now(), wallet: walletId },
    ]);

    toast.success("Mission started!");
  } catch (error) {
    console.error("Error starting mission:", error);
    toast.error("An error occurred while starting the mission");
  }
}


  return (
    <Sheet>
      <SheetTrigger disabled={!character} className="bg-black text-white h-10.5 w-50 border border-[#6B6969] rounded-lg disabled:opacity-50">
        Go on a mission
      </SheetTrigger>
      <SheetContent
        side="right"
        className="!bg-[#4D4D4D] border-none overflow-auto"
      >
        <SheetHeader>
          <SheetTitle className="hidden">Missions List</SheetTitle>
          <SheetDescription className="hidden">missions list</SheetDescription>
          <div className="flex justify-between gap-2 items-center">
            {character && (
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <img
                  src={`/characters/${character.id}.png`}
                  className="size-20  sm:size-25 border-3 border-black rounded-full"
                  alt={character.nickname}
                />
                <div>
                  <h1 className="font-bold text-[21px]">
                    {character.nickname}
                  </h1>
                  <p className="text-xs">
                    <span className="font-bold">Village:</span>{" "}
                    {character.village}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <img src="/xp.png" alt="xp coin" />
              <span className="text-[#FFD95E]">
                {user?.profiles?.[0]?.platformData?.xp ?? 0} XP
              </span>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="ongoing" className="">
          <TabsList className="ml-4">
            <div>
              <TabsTrigger
                className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] p-2"
                value="ongoing"
              >
                Ongoing
              </TabsTrigger>
              <TabsTrigger
                className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] p-2"
                value="completed"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] p-2"
                value="rank"
              >
                Rank
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="ongoing">
            <OngoingMissions
              missions={ongoingMissions.map((m) => ({
                ...m,
                remaining: remainingTimes[m.id] ?? m.duration,
              }))}
            />
            {hardcodedMissions.map((mission, index) => (
              <div
                key={index}
                className={`px-7 py-2 border-t-[0.5px] border-b-[0.5px] border-t-[#6A6868] border-b-[#6A6868]`}
              >
                <div className="flex items-center justify-between gap-8 mb-2">
                  <h1 className="font-bold text-wrap text-base">
                    {mission.name}
                  </h1>
                  <Button
                    onClick={() =>
                      startMission({
                        ...mission,
                        id: shortId,
                        wallet: wallet.publicKey?.toString() as string,
                      })
                    }
                    className="flex bg-[#232320] rounded-[5px] shadow-2xl shadow-[#FFF1763B] cursor-pointer items-center gap-2.5"
                  >
                    Start
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <img src="/star.svg" width={15} height={15} alt="star" />
                  <span className="text-[#FFCE31] capitalize text-xs">
                    Mission level:{" "}
                    <span className="text-white">{mission.difficulty}</span>
                  </span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="completed">
            <CompletedMissions missions={completedMissions} />
          </TabsContent>

          <TabsContent value="rank">
            <NinjaRanks />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
