import { create } from "zustand";
import { User } from "@honeycomb-protocol/edge-client";
import { client } from "@/utils/constants/client";
import { toast } from "react-toastify";

const PROJECT_ADDRESS = process.env.PROJECT_ADDRESS as string;

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (newInfo: Partial<User>) => void;
  refreshUser: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (newUserData: Partial<User>) =>
    set((state) => ({
      user: {
        ...(state.user ?? {}),
        ...newUserData,
      } as User,
    })),
  refreshUser: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      const { profile: profiles } = await client.findProfiles({
        userIds: [currentUser.id],
        projects: [PROJECT_ADDRESS],
        includeProof: true,
      });

      if (profiles && profiles.length > 0) {
        set((state) => ({
          user: {
            ...state.user,
            profiles: profiles,
          } as User,
        }));
      }
    } catch (error) {
      toast.error(`Error refreshing profiles, ${error}`);
    }
  },
}));
