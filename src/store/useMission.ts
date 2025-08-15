import { create } from "zustand";
import { MissionType } from "@/components/Missions";

interface MissionsState {
  ongoingMissions: MissionType[];
  completedMissions: MissionType[];
  remainingTimes: Record<string, number>;
  setOngoing: (missions: MissionType[]) => void;
  setCompleted: (missions: MissionType[]) => void;
  moveToCompleted: (missionId: string) => void;
  setRemainingTime: (missionId: string, time: number) => void;
}

export const useMissionsStore = create<MissionsState>((set) => ({
  ongoingMissions: [],
  completedMissions: [],
  remainingTimes: {},
  setOngoing: (missions) => set({ ongoingMissions: missions }),
  setCompleted: (missions) => set({ completedMissions: missions }),
  moveToCompleted: (missionId) =>
    set((state) => {
      const mission = state.ongoingMissions.find((m) => m.id === missionId);
      if (!mission) return {};
      const restTimes = { ...state.remainingTimes };
      delete restTimes[missionId];
      return {
        ongoingMissions: state.ongoingMissions.filter((m) => m.id !== missionId),
        completedMissions: [...state.completedMissions, mission],
        remainingTimes: restTimes,
      };
    }),
  setRemainingTime: (missionId, time) =>
    set((state) => ({
      remainingTimes: { ...state.remainingTimes, [missionId]: time },
    })),
}));
