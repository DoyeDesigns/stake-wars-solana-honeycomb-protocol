import React from "react";
import { MissionType } from "./Missions";
import { Progress } from "./ui/progress";

type OngoingMissionsProps = {
  missions: MissionType[];
};

export default function OngoingMissions({ missions }: OngoingMissionsProps) {
  const formatTime = (seconds: number) => {
    const hour = Math.floor(seconds / 3600);
    const minute = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${hour}:${minute.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div>
      {missions.map((mission, index) => {
        const startedAtMs = mission.startedAt
          ? mission.startedAt.toDate().getTime()
          : 0;
        const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
        const remaining = Math.max(mission.duration - elapsedSeconds, 0);

        return (
          <div
            key={index}
            className={`px-7 py-4 ${
              remaining > 0 ? "bg-[#373636]" : ""
            } border-t-[0.5px] border-b-[0.5px] border-t-[#6A6868] border-b-[#6A6868]`}
          >
            <div className="flex items-center justify-between gap-8 mb-2">
              <h1 className="font-bold text-wrap text-base">{mission.name}</h1>
              <div className="flex items-center gap-2.5">
                <img src="/xp.png" alt="xp coin" />
                <span className="text-[#FFD95E] text-sm">
                  {mission.reward} XP
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <img src="/star.svg" width={15} height={15} alt="star" />
              <span className="text-[#FFCE31] capitalize text-xs">
                Mission level:{" "}
                <span className="text-white">{mission.difficulty}</span>
              </span>
            </div>

            {mission.startedAt ? (
              <div>
                <Progress value={(elapsedSeconds / mission.duration) * 100} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-[#BFE528]">Ongoing</span>
                  <span className="font-bold text-sm">
                    {formatTime(remaining)}
                  </span>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        );
      })}
    </div>
  );
}
