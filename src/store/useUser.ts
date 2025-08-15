import { create } from "zustand";
import { User } from "@honeycomb-protocol/edge-client";

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (newInfo: Partial<User>) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
    updateUser: (newUserData: Partial<User>) =>
    set((state) => ({
      user: {
        ...(state.user ?? {}), 
        ...newUserData,
      } as User, 
    })),
}));
