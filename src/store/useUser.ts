import { create } from "zustand";
import { User } from "@honeycomb-protocol/edge-client";
import { client } from "@/utils/constants/client";

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
      // Only fetch profiles (user data doesn't change)
      const currentUser = get().user;
      if (!currentUser) return;
      
      const { profile: profiles } = await client.findProfiles({
        userIds: [currentUser.id],
        projects: [PROJECT_ADDRESS],
        includeProof: true,
      });

             // Update user with latest profiles
       if (profiles && profiles.length > 0) {
         set((state) => ({
           user: {
             ...state.user,
             profiles: profiles,
           } as User,
         }));
       }
    } catch (error) {
      console.error("Error refreshing profiles:", error);
    }
  },
}));
